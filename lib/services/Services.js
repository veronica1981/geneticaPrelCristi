import axios from 'axios'
const API_URL = process.env.API_URL;
const headers = {
    'X-API-KEY': 'fccl2023', // Ensure this is the correct key
};

export async function getAsoc() {
    return axios.get(`${API_URL}/Asociatii`, {headers: headers})
        .then(response => {
            return response.data; // Directly return the data from the response
        })
        .catch(function (error) {
            console.log(error);
            return error;
        });
}

export async function getControlsMeta(controlor) {
    return axios
        .get(
            `${API_URL}/ControlMeta/?controlor=${controlor}`, {headers: headers}
        )
        .then((response) => {
            return response.data
        })
        .catch(function (error) {
            console.log(error)
            return error
        })
}

export async function saveControlMeta(ferma, dataset, controlor, linii) {
    const requestData = {
        ferma: ferma,
        dataset: dataset,
        definitiv: false,
        controlor: Number(controlor),
    };
    try {
        const response = await axios.post(`${API_URL}/ControlMeta`, requestData, { headers: headers });
        return response.data;

    } catch (error) {
        logErrorToServer(error.message, JSON.stringify(requestData));
        throw new Error("Controlul nu a fost salvat " + error.message);
    }
}


export async function deleteControls(linii, controlId) {
    try {
        await axios.delete(`${API_URL}/Control/ByContrId/${controlId}`, {headers: headers});
        await saveControlsService(linii, controlId);
        console.log("Control deleted and saved successfully.");
    } catch (error) {
        // Log the error along with additional context
        console.log(error.message, JSON.stringify(linii));
        logErrorToServer(error.message, "stergere/salvare" + JSON.stringify(linii) + " controlorid: " + controlId);

        // Rethrow the error to allow further error handling where deleteControls is called
        throw new Error("Controlul nu a fost salvat " + error.message);
    }
}


export function saveControlsService(linii, controlId) {
    var arr = [];
    linii.map((linie) => {
        let obj = {
            cant: Number(linie[1].value.toString().replace(',', '.')),
            crot: linie[0].value,
            codbare: Number(linie[2]),
        };

        if (controlId) {
            obj.contrid = controlId;
        }
        arr.push(obj);
    });

    axios.post(`${API_URL}/Control`, arr, {headers: headers})
        .then(response => {
            console.log('Save successful', response.data);
        })
        .catch(function (error) {
            console.log(error.message, JSON.stringify(arr));
            logErrorToServer(error,message, JSON.stringify(arr) +  + "controlorid: " + controlId === undefined ? "controlNou" : controlId);
            throw new Error("Controlul nu a fost salvat " + error.message);
        });
}


export async function putDefinitivControlMeta(idC) {
    return axios
        .put(`${API_URL}/ControlMeta/${idC}`, {}, {headers: headers})
        .then((response) => {
            return response.data
        })
        .catch(function (error) {
            console.log(error)
        })
}

export async function getControls(controlId) {
    try {
        const response = await axios.get(`${API_URL}/Control/ByContrId/${controlId}`, { headers: headers });
        return response.data;
    } catch (error) {
        console.log(error);
        return error;
    }
}



export async function getPrelevatoriAsoc(fabricaid) {
    return axios.get(`${API_URL}/Prelevatori/${fabricaid}`, {headers: headers})
        .then((response) => {return response.data.filter(item => item.nume !== "")})
        .catch(function (error) {
            console.log(error, response)
            return error
        })
}

function logErrorToServer(error, requestData) {
    const errorLog = {
        Message: error,
        RequestData: requestData, // Add the request data to your log
    };

    axios.post(`${API_URL}/Error`, errorLog, { headers: headers })
        .then(logResponse => console.log('Error logged successfully', logResponse.data))
        .catch(logError => console.error('Error logging failed', logError));
}




