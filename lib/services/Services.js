import axios from 'axios'

const headers = {
    'X-API-KEY': 'fccl2023', // Ensure this is the correct key
};

export async function getAsoc() {
    return axios.get('http://185.92.192.96/genetica/api/Asociatii', {headers: headers})
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
            `http://185.92.192.96/genetica/api/ControlMeta/?controlor=${controlor}`, {headers: headers}
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
        const response = await axios.post('http://185.92.192.96/genetica/api/ControlMeta', requestData, { headers: headers });
        await saveControls(linii, response.data.id); // Now awaiting saveControls
    } catch (error) {
        logErrorToServer(error.message, JSON.stringify(requestData));
        throw new Error("Controlul nu a fost salvat " + error.message);
    }
}


export async function deleteControls(linii, controlId) {
    try {
        await axios.delete(`http://185.92.192.96/genetica/api/Control/ByContrId/${controlId}`, {headers: headers});
        await saveControls(linii, controlId);
        console.log("Control deleted and saved successfully.");
    } catch (error) {
        // Log the error along with additional context
        console.log(error.message, JSON.stringify(linii));
        logErrorToServer(error.message, "stergere/salvare" + JSON.stringify(linii) + " controlorid: " + controlId);

        // Rethrow the error to allow further error handling where deleteControls is called
        throw new Error("Controlul nu a fost salvat " + error.message);
    }
}


export function saveControls(linii, controlId) {
    var arr = [];
    linii.map((linie) => {
        // Create the base object without `contrid`
        let obj = {
            cant: Number(linie[1].value.toString().replace(',', '.')),
            crot: linie[0].value,
            codbare: Number(linie[2]),
        };

        // Conditionally add `contrid` if it's defined (not undefined and not null)
        if (controlId) {
            obj.contrid = controlId;
        }

        // Push the constructed object into the array
        arr.push(obj);
    });


    axios.post('http://185.92.192.96/genetica/api/Control', arr, {headers: headers})
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
        .put(`http://185.92.192.96/genetica/api/ControlMeta/${idC}`, {}, {headers: headers})
        .then((response) => {
            return response.data
        })
        .catch(function (error) {
            console.log(error)
        })
}

export async function getControls(controlId) {
    return axios.get(`http://185.92.192.96/genetica/api/Control/ByContrId/${controlId}`, {headers: headers})
        .then((response) => {return response.data})
        .catch(function (error) {
            console.log(error, response)
            return error
        })
}



export async function getPrelevatoriAsoc(fabricaid) {
    return axios.get(`http://185.92.192.96/genetica/api/Prelevatori/${fabricaid}`, {headers: headers})
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

    axios.post('http://185.92.192.96/genetica/api/Error', errorLog, { headers: headers })
        .then(logResponse => console.log('Error logged successfully', logResponse.data))
        .catch(logError => console.error('Error logging failed', logError));
}




