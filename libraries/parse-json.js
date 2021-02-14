const parseJSON = (data) => {
    let parsedData;
    try {
        parsedData = JSON.parse(data);
    } catch(err) {
        return false;
    }
    return parsedData;
}

module.exports = {
    parseJSON:parseJSON
}
