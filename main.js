function encodeFile(event) {
    const file = event.target.files[0];

    const reader = new FileReader();
    reader.readAsArrayBuffer(file);
    reader.onload = () => {
        const inputImage = UPNG.decode(reader.result);
        const textArea = document.getElementById("message");
        const message = textArea.value;
        const outputImage = encodeMessage(inputImage, message);
        const image = document.getElementById("image");
        const blob = new Blob([outputImage])
        image.src = window.URL.createObjectURL(blob);
    };
}

function decodeFile(event) {
    const file = event.target.files[0];

    const image = document.getElementById("image");
    image.src = window.URL.createObjectURL(file);

    const reader = new FileReader();
    reader.readAsArrayBuffer(file);
    reader.onload = () => {
        const image = UPNG.decode(reader.result);
        const message = decodeMessage(image);
        const textArea = document.getElementById("message");
        textArea.value = (message) ? message : "<invalid image>";
    };
}

function encodeMessage(image, message) {
    const messageBytes = new TextEncoder().encode(message);
    const requiredBytes = messageBytes.length * 8;

    let stride = 0;
    let colorChannels = 0;
    let alphaChannels = 0;
    if (image.ctype === 2) {
        stride = 3;
        colorChannels = 3;
        alphaChannels = 0;
    } else if (image.ctype === 6) {
        stride = 4;
        colorChannels = 3;
        alphaChannels = 1;
    } else {
        return null;
    }

    const byteLength = image.width * image.height * stride;
    if (requiredBytes >= byteLength - 1) {
        return null;
    }

    let padding = Math.floor((image.data.length - requiredBytes) / 2.0);
    let startIndex = padding;
    let endIndex = padding + requiredBytes;

    const buffer = new ArrayBuffer(byteLength);
    const data = new Uint8Array(buffer);

    for (let i = 0; i < startIndex; ++i) {
        data[i] = image.data[i] & (0b11111110);
    }

    data[startIndex - 1] |= 1;

    let offset = startIndex;
    for (let i = 0; i < messageBytes.length; ++i) {
        let byte = messageBytes[i];

        data[offset + 0] = image.data[offset + 0] & 0b11111110;
        data[offset + 0] |= (byte & (1 << 7)) >> 7;

        data[offset + 1] = image.data[offset + 1] & 0b11111100;
        data[offset + 1] |= (byte & (1 << 6)) >> 6;

        data[offset + 2] = image.data[offset + 2] & 0b11111110;
        data[offset + 2] |= (byte & (1 << 5)) >> 5;

        data[offset + 3] = image.data[offset + 3] & 0b11111110;
        data[offset + 3] |= (byte & (1 << 4)) >> 4;

        data[offset + 4] = image.data[offset + 4] & 0b11111110;
        data[offset + 4] |= (byte & (1 << 3)) >> 3;

        data[offset + 5] = image.data[offset + 5] & 0b11111110;
        data[offset + 5] |= (byte & (1 << 2)) >> 2;

        data[offset + 6] = image.data[offset + 6] & 0b11111110;
        data[offset + 6] |= (byte & (1 << 1)) >> 1;

        data[offset + 7] = image.data[offset + 7] & 0b11111110;
        data[offset + 7] |= (byte & (1 << 0)) >> 0;

        offset += 8;
    }

    for (let i = endIndex; i < byteLength; ++i) {
        data[i] = image.data[i] & (0b11111110);
    }

    data[endIndex] |= 1;

    return UPNG.encodeLL([buffer], image.width, image.height, colorChannels, alphaChannels, image.depth);
}

function decodeMessage(image) {
    let stride = 0;
    if (image.ctype === 2) {
        stride = 3;
    } else if (image.ctype === 6) {
        stride = 4;
    } else {
        return null;
    }

    const validRange = image.width * image.height * stride;
    const isMarker = (byte, index) => { return index < validRange && (byte & 0b00000001) != 0; }
    const first = _.findIndex(image.data, isMarker);
    const last = _.findLastIndex(image.data, isMarker);

    if (first === -1 || first === last || last - first > 1024) {
        return null;
    }

    const begin = first + 1;
    let end = last;

    if (((end - begin) % 8) != 0) {
        end += 8 - (end - begin) % 8;
    }

    let messageData = [];
    let messageSlice = image.data.slice(begin, end);
    for (const chunk of _.chunk(messageSlice, 8)) {
        let b1 = chunk[0] & 1;
        let b2 = chunk[1] & 1;
        let b3 = chunk[2] & 1;
        let b4 = chunk[3] & 1;
        let b5 = chunk[4] & 1;
        let b6 = chunk[5] & 1;
        let b7 = chunk[6] & 1;
        let b8 = chunk[7] & 1;
        let byte = (b1 << 7) | (b2 << 6) | (b3 << 5) | (b4 << 4) | (b5 << 3) | (b6 << 2) | (b7 << 1) | (b8 << 0);
        messageData.push(byte);
    }

    const buffer = new Uint8Array(messageData);
    const message = new TextDecoder().decode(buffer);
    return message;
}
