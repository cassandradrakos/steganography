# Steganography

Steganography is the practice of concealing a file, message, image, or video within another file, message, image, or video.

## Least Significant Bit Steganography

This repository contains code for using steganography to conceal a hidden text message within a PNG image. This is accomplished by storing the message within the least significant bits of the image's uncompressed color data.

The image below shows a representation of how color data is stored in an image, with 8 bits per color channel. In this representation, the "least significant bit" is the right-most bit in the bit string, and changes to this bit have an almost imperceptible effect on the image.

![](lena.png)

The code in this repository leverages this fact, encoding text messages in images by zeroing out the least significant bits in the uncompressed image data, and then storing the text data within these bits.

## Demo

[Link](https://cassandradrakos.github.io/steganography)
