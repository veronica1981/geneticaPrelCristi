export const checkConnection = async () => {
    const state = await NetInfo.fetch();
    if (!state.isConnected) {
        alert(
            "NU EXISTA CONEXIUNE INTERNET",
            "Momentan nu exista conexiune internet si nu puteti lucra in aplicatie",
            [
                {text: "OK", onPress: () => console.log("OK Pressed")}
            ]
        );
    }
    return state.isConnected; // This will return true or false based on the connection status
};
