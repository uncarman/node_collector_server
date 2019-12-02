

function collectorConfig() {
    return [
        // {
        //     "code": 5,    // 对应collector code
        //     "module": "modbus",     // 采集模式 modbus
        //     "cmdTimeout": 5000,
        //     "commands": [           // 命令以及解析
        //         {
        //             "options": {
        //                 "cmdType": "readHoldingRegisters",
        //                 "startAddress": 0,
        //                 "regNum": 16
        //             },
        //             "points": [
        //                 {
        //                     "id": "a",
        //                     "offset": 0,
        //                     "regNum": 1,
        //                     "func": [
        //                         [
        //                             "hex"
        //                         ]
        //                     ]
        //                 },
        //                 {
        //                     "id": "b",
        //                     "offset": 1,
        //                     "regNum": 1,
        //                     "func": [
        //                         [
        //                             "swapToBE",
        //                             "10"
        //                         ],
        //                         [
        //                             "U16BE"
        //                         ],
        //                         [
        //                             "divide",
        //                             10,
        //                             2
        //                         ]
        //                     ]
        //                 },
        //                 {
        //                     "id": "c",
        //                     "offset": 3,
        //                     "regNum": 2,
        //                     "func": [
        //                         [
        //                             "swapToBE",
        //                             "1032"
        //                         ],
        //                         [
        //                             "U32BE"
        //                         ]
        //                     ]
        //                 },
        //                 {
        //                     "id": "ind",
        //                     "offset": 10,
        //                     "regNum": 1,
        //                     "func": [
        //                         [
        //                             "swapToBE",
        //                             "10"
        //                         ],
        //                         [
        //                             "U16BE"
        //                         ]
        //                     ]
        //                 }
        //             ]
        //         }
        //     ]
        // },
        {
            "code": 5,    // 对应collector code
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
        },
    ];
};


module.exports.collectorConfig = collectorConfig;