'use strict';

// amqp lib
const amqp = require('amqplib');

// helper
const helper = require('./helper.js');

function Amqp(config) {
    
}

Amqp.prototype.sendData = function (data) {
    helper.log("[to server]:", JSON.stringify(data));
};

Amqp.prototype.connect = function () {
    
};

module.exports = Amqp;