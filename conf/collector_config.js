

function collectorConfig() {
    return [
        // dlt645 电表
        {
            "host": "127.0.0.1",
            "port": "7000",
            "collectorId": 3,       // 对应collector_id
            "module": "dlt645",     // 采集模式 modbus
            "cmdTimeout": 5000,
            "commands": [
                {
                    "options": {
                        "name": "positive_active_power",
                        "code": "00010000"
                    },
                    "points":[
                        {"id": "positive_active_power", "dotPosition": 6 }
                    ]
                },
                {
                    "options": {
                        "name": "reverse_active_power",
                        "code": "00020000"
                    },
                    "points":[
                        {"id": "reverse_active_power", "dotPosition": 6 }
                    ]
                },
                {
                    "options": {
                        "name": "positive_jian_power",
                        "code": "00010100"
                    },
                    "points":[
                        {"id": "positive_jian_power", "dotPosition": 6 }
                    ]
                },
                {
                    "options": {
                        "name": "positive_feng_power",
                        "code": "00010200"
                    },
                    "points":[
                        {"id": "positive_feng_power", "dotPosition": 6 }
                    ]
                },
                {
                    "options": {
                        "name": "positive_ping_power",
                        "code": "00010300"
                    },
                    "points":[
                        {"id": "positive_ping_power", "dotPosition": 6 }
                    ]
                },
                {
                    "options": {
                        "name": "positive_gu_power",
                        "code": "00010400"
                    },
                    "points":[
                        {"id": "positive_gu_power", "dotPosition": 6 }
                    ]
                },
                {
                    "options": {
                        "name": "reverse_jian_power",
                        "code": "00020100"
                    },
                    "points":[
                        {"id": "reverse_jian_power", "dotPosition": 6 }
                    ]
                },
                {
                    "options": {
                        "name": "reverse_feng_power",
                        "code": "00020200"
                    },
                    "points":[
                        {"id": "reverse_feng_power", "dotPosition": 6 }
                    ]
                },
                {
                    "options": {
                        "name": "reverse_ping_power",
                        "code": "00020300"
                    },
                    "points":[
                        {"id": "reverse_ping_power", "dotPosition": 6 }
                    ]
                },
                {
                    "options": {
                        "name": "reverse_gu_power",
                        "code": "00020400"
                    },
                    "points":[
                        {"id": "reverse_gu_power", "dotPosition": 6 }
                    ]
                }
            ]
        },
        // modbus电表
        {
            "host": "127.0.0.1",
            "port": "7000",
            "collectorId": 2,       // 对应collector_id
            "module": "modbus",     // 采集模式 modbus
            "cmdTimeout": 5000,
            "commands": [           // 命令以及解析
                {
                    "options": {
                        "cmdType": "readHoldingRegisters",
                        "startAddress": 0,
                        "regNum": 10
                    },
                    "points": [
                        {
                            "id": "电流",
                            "offset": 0,
                            "regNum": 1,
                            "func": [
                                [ "swapToBE", "10" ],
                                [ "U16BE" ],
                                [ "divide", 10, 2 ]
                            ]
                        },
                        {
                            "id": "电压",
                            "offset": 2,
                            "regNum": 1,
                            "func": [
                                [ "swapToBE", "10" ],
                                [ "U16BE" ],
                                [ "divide", 10, 2 ]
                            ]
                        },
                        {
                            "id": "正向有功总",
                            "offset": 4,
                            "regNum": 2,
                            "func": [
                                [ "swapToBE", "1032" ],
                                [ "U32BE" ]
                            ]
                        },
                        {
                            "id": "反向有功总",
                            "offset": 5,
                            "regNum": 1,
                            "func": [
                                [ "swapToBE", "10" ],
                                [ "U16BE" ]
                            ]
                        }
                    ]
                }
            ]
        },
        // modbus电表
        {
            "code": 4,    // 对应collector code
            "module": "modbus",     // 采集模式 modbus
            "cmdTimeout": 5000,
            "commands": [           // 命令以及解析
                {
                    "options": {
                        "cmdType": "readHoldingRegisters",
                        "startAddress": 8204,
                        "regNum": 2
                    },
                    "points": [
                        {
                            "id": "pa",
                            "offset": 0,
                            "regNum": 2,
                            "func": [
                                [
                                    "hex"
                                ]
                            ]
                        }
                    ]
                },
                {
                    "options": {
                        "cmdType": "readHoldingRegisters",
                        "startAddress": 1028,
                        "regNum": 2
                    },
                    "points": [
                        {
                            "id": "ra",
                            "offset": 0,
                            "regNum": 2,
                            "func": [
                                [
                                    "hex"
                                ]
                            ]
                        }
                    ]
                }
            ]
        }
    ]; 
};


module.exports.collectorConfig = collectorConfig;