'use strict';

const lenMap = {
    I16BE: 2,
    U16BE: 2,
    I32BE: 4,
    U32BE: 4,
    F32BE: 4,
    D64BE: 8
};

const decUtil = {

    // TODO(Young): Split the logic and data
    register: (funcName, func) => {
        module.exports[funcName] = func;
    },

    registerLength: (type, len) => {
        lenMap[type] = len;
    },

    getLen: type => {
        if (lenMap.hasOwnProperty(type)) {
            return lenMap[type];
        }
        throw new Error(`getLen(${type}), unknown type`);
    },

    stringToInt16: string => {
        let lowString = string.slice(0, 2);
        let highString = string.slice(2);
        return parseInt(highString + lowString, 16);
    },

    swapToBE: (buf, order) => {
        // examples:
        // order = '10'; // 两个字节，高位在前
        // order = '1032'; // 四个字节，前两个字节是低位，高位在前，后两个字节是高位，高位在前
        // order = '76543210'; // 八个字节，高位在前

        if (buf.length !== order.length) {
            throw new Error(`swapToBE: buf.length[${buf.length}] != order.length[${order.length}].`);
        }

        switch (order) {
            case '10':
            case '3210':
            case '76543210':
                return buf;
            default: break;
        }

        let newBuf = Buffer.allocUnsafe(buf.length);
        let i = buf.length;

        order.split('').forEach(pos => {
            newBuf[pos] = buf[--i];
        });

        return newBuf;
    },

    slice: (buf, start, end) => {
        if (!start) {
            start = 0;
        }
        if (!end) {
            end = buf.length;
        }
        return buf.slice(start, end);
    },

    I8: buf => {
        return buf.readInt8();
    },

    I16BE: buf => {
        return buf.readInt16BE();
    },

    I32BE: buf => {
        return buf.readInt32BE();
    },

    U8: buf => {
        return buf.readUInt8();
    },

    U16BE: buf => {
        return buf.readUInt16BE();
    },

    U32BE: buf => {
        return buf.readUInt32BE();
    },

    F32BE: buf => {
        return buf.readFloatBE();
    },

    D64BE: buf => {
        return buf.readDoubleBE();
    },

    hex: (buf, start, end) => {
        if (!start) {
            start = 0;
        }
        if (!end) {
            end = buf.length;
        }
        return buf.toString('hex', start, end);
    },

    mask: (value, mask) => {
        return value & mask;
    },

    readBitInBuffer: (buffer, offset) => {
        let bits = [];
        for (let i = 0; i < Math.min(buffer.length, buffer.readUInt8(0) + 1); i++) {
            for (let j = 0; j < 8; j++) {
                bits.push((buffer.readUInt8(i) >> j) & 0x1);
            }
        }

        return offset ? bits[offset] : bits;
    },

    shift: (value, shift) => {
        return shift > 0 ? value << shift : value >> shift;
    },

    normalize: (val, iMin, iMax, oMin, oMax) => {
        if (val <= iMin) {
            return oMin;
        }
        if (val >= iMax) {
            return oMax;
        }
        if (val === 0) {
            return 0;
        }
        return (oMax - oMin) / (iMax - iMin) * (val - iMin) + oMin;
    },

    divide: (value, units, decimal) => {
        return (value / units).toFixed(decimal);
    },

    round: (val, precision) => {
        let factor = Math.pow(10, precision);
        let intVal = Math.round(val * factor);
        let rndVal = intVal / factor;
        return rndVal;
    },

    toString: (buf, format) => {
        return buf.toString(format);
    },

    toBits: buffer => {
        let bits = [];
        for (let i = buffer.length; i > 0; i--) {
            for (let j = 0; j < 8; j++) {
                bits.push((buffer.readUInt8(i - 1) >> j) & 0x1);
            }
        }
        return bits;
    },

    batch: (data, funcList) => {
        for (let i = 0, n = funcList.length; i < n; i++) {
            if (funcList[i].length === 0) {
                continue;
            }

            let func = decUtil[funcList[i][0]];
            if (!func) {
                throw new Error(`decUtil[${funcList[i][0]}] not exist`);
            }

            let args = Array.prototype.concat([data], funcList[i].slice(1));
            data = func(...args);
        }
        return data;
    }
};

module.exports = decUtil;