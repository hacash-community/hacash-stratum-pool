var util = require('./util.js');

exports.CreateGeneration = function (rpcData, extraNoncePlaceholder) {

    return [rpcData.coinbasetxn.replace("0000000000000000000000000000000000000000000000000000000000000000", "000000000000000000000000000000000000000000000000"), "00" ];

};
