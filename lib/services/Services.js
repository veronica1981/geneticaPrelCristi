// services/Services.js
import axios from 'axios';
import Constants from 'expo-constants';

const API_URL =
    process.env.EXPO_PUBLIC_API_URL ??
    Constants?.expoConfig?.extra?.apiUrl ??
    Constants?.manifest?.extra?.apiUrl ?? // legacy
    null;

if (!API_URL) {
    console.warn(
        '[Config] API_URL is not set. Define EXPO_PUBLIC_API_URL or expo.extra.apiUrl.'
    );
}

const api = axios.create({
    baseURL: API_URL || 'http://localhost', // harmless fallback; real calls will still fail if undefined
    headers: {
        'X-API-KEY': 'fccl2023',
    },
    // You can add timeout if you want:
    // timeout: 15000,
});

/** Helpers */
function logErrorToServer(message, requestData) {
    const payload = { Message: message, RequestData: requestData };
    if (!API_URL) {
        // No server to log to; at least log locally.
        console.error('[ErrorLog skipped] No API_URL set', payload);
        return;
    }
    api
        .post('/Error', payload)
        .then((res) => console.log('Error logged successfully', res.data))
        .catch((err) => console.error('Error logging failed', err?.message));
}

/** API calls */
export async function getAsoc() {
    try {
        if (!API_URL) throw new Error('API_URL is not configured');
        const { data } = await api.get('/Asociatii');
        return data;
    } catch (error) {
        console.error('[getAsoc]', error?.message, API_URL);
        logErrorToServer(error?.message, 'getAsoc');
        throw error;
    }
}

export async function getControlsMeta(controlor) {
    try {
        if (!API_URL) throw new Error('API_URL is not configured');
        const { data } = await api.get('/ControlMeta/', {
            params: { controlor },
        });
        return data;
    } catch (error) {
        console.error('[getControlsMeta]', error?.message);
        logErrorToServer(error?.message, JSON.stringify({ controlor }));
        throw error;
    }
}

export async function saveControlMeta(ferma, dataset, controlor /*, linii */) {
    const requestData = {
        ferma,
        dataset,
        definitiv: false,
        controlor: Number(controlor),
    };
    try {
        if (!API_URL) throw new Error('API_URL is not configured');
        const { data } = await api.post('/ControlMeta', requestData);
        return data;
    } catch (error) {
        logErrorToServer(error?.message, JSON.stringify(requestData));
        throw new Error('Controlul nu a fost salvat: ' + error?.message);
    }
}

export async function deleteControls(linii, controlId) {
    try {
        if (!API_URL) throw new Error('API_URL is not configured');
        await api.delete(`/Control/ByContrId/${controlId}`);
        await saveControlsService(linii, controlId);
        console.log('Control deleted and saved successfully.');
    } catch (error) {
        console.error('[deleteControls]', error?.message, JSON.stringify(linii));
        logErrorToServer(
            error?.message,
            'stergere/salvare ' + JSON.stringify(linii) + ' controlorid: ' + controlId
        );
        throw new Error('Controlul nu a fost salvat: ' + error?.message);
    }
}

export function saveControlsService(linii, controlId) {
    if (!API_URL) throw new Error('API_URL is not configured');

    const arr = (linii ?? []).map((linie) => {
        // expecting linie = [ {value: crot}, {value: cant}, codbare ]
        const crot = linie?.[0]?.value;
        const cantRaw = linie?.[1]?.value;
        const codbare = linie?.[2];

        const cant = Number(String(cantRaw ?? '').replace(',', '.'));
        const obj = {
            cant: Number.isFinite(cant) ? cant : 0,
            crot,
            codbare: Number(codbare),
            ...(controlId ? { contrid: controlId } : {}),
        };
        return obj;
    });

    return api
        .post('/Control', arr)
        .then((response) => {
            console.log('Save successful', response.data);
            return response.data;
        })
        .catch((error) => {
            console.error('[saveControlsService]', error?.message, JSON.stringify(arr));
            logErrorToServer(
                error?.message,
                JSON.stringify(arr) + ' controlorid: ' + (controlId ?? 'controlNou')
            );
            throw new Error('Controlul nu a fost salvat: ' + error?.message);
        });
}

export async function putDefinitivControlMeta(idC) {
    try {
        if (!API_URL) throw new Error('API_URL is not configured');
        const { data } = await api.put(`/ControlMeta/${idC}`, {});
        return data;
    } catch (error) {
        console.error('[putDefinitivControlMeta]', error?.message);
        logErrorToServer(error?.message, JSON.stringify({ idC }));
        throw error;
    }
}

export async function getControls(controlId) {
    try {
        if (!API_URL) throw new Error('API_URL is not configured');
        const { data } = await api.get(`/Control/ByContrId/${controlId}`);
        return data;
    } catch (error) {
        console.error('[getControls]', error?.message);
        logErrorToServer(error?.message, JSON.stringify({ controlId }));
        throw error;
    }
}

export async function getPrelevatoriAsoc(fabricaid) {
    try {
        if (!API_URL) throw new Error('API_URL is not configured');
        const { data } = await api.get(`/Prelevatori/${fabricaid}`);
        return (data ?? []).filter((item) => item?.nume !== '');
    } catch (error) {
        console.error('[getPrelevatoriAsoc]', error?.message);
        logErrorToServer(error?.message, JSON.stringify({ fabricaid }));
        throw error;
    }
}
