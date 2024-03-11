on("ready", function () {
    var version = '2.0.3';
    log("-=> DW_ApplyWounds v" + version + " Loaded ");
});
on("chat:message", function (msg) {
    if (msg.type == "api" && msg.content.indexOf("!DW_ApplyWounds") == 0) {
        const showLog = false;

        var params = {}
        var tarData = {}

        function logMessage(message, override = false) {
            if (showLog || override) {
                log(message)
            }
        }

        function parseArgs(args) {
            for (lcv = 1; lcv < args.length; lcv++) {
                var splitValue = args[lcv].trim().split("|");
                var key = splitValue[0];
                var value = splitValue[1];
                params[key] = value;
            }
        }

        function getTargetData() {
            tarData["Head"] = parseInt(getAttrByName(params.targetCharID, "HArmour"));
            tarData["Left Arm"] = parseInt(getAttrByName(params.targetCharID, "ArArmour"));
            tarData["Right Arm"] = parseInt(getAttrByName(params.targetCharID, "AlArmour"));
            tarData["Left Leg"] = parseInt(getAttrByName(params.targetCharID, "LlArmour"));
            tarData["Right Leg"] = parseInt(getAttrByName(params.targetCharID, "LrArmour"));
            tarData["Body"] = parseInt(getAttrByName(params.targetCharID, "BArmour"));
            tarData["toughMult"] = parseInt(getAttrByName(params.targetCharID, "unnatural-Toughness"));
            tarData["tough"] = parseInt(getAttrByName(params.targetCharID, "Toughness"));

            // Check if a target is a player
            tarData["charType"] = "NPC";
            var value = findObjs({ type: 'attribute', characterid: params.targetCharID, name: "charType" })[0];
            if (value) {
                tarData["charType"] = value.get('current').toUpperCase();
            }

            tarData["charName"] = getAttrByName(params.targetCharID, "character_name");
            tarData["name"] = tarData.charName;
            var token = findObjs({ type: 'graphic', _id: params.tarTokenID })[0];
            if (token) {
                tarData["name"] = token.get("name");
                tarData["currentWounds"] = parseInt(token.get("bar1_value"));
                tarData["maxWounds"] = parseInt(token.get("bar1_max"));
            }

            tarData["TB"] = Math.floor(tarData.tough / 10);
            tarData.toughMult -= params.felling
            if (tarData.toughMult > 0) {
                tarData.TB = tarData.TB * tarData.toughMult;
            }
        }

        function determineWounds(hit) {
            var location = hit[0];
            var damage = hit[1];
            var armourValue = tarData[location] - parseInt(params.pen);
            armourValue = armourValue > 0 ? armourValue : 0;
            var wounds = damage - armourValue - tarData.TB;
            wounds = wounds > 0 ? wounds : 0;
            logMessage(`Dam:${damage}, ArmourValue:${armourValue}, TB:${tarData.TB}, Wounds:${wounds}`);
            if (tarData.charType == "HORDE") {
                logMessage("Determine Horde Damage!")
                if (params.blast > 0) {
                    return params.blast;
                }
                else if (params.hellfire == "true") {
                    return 2;
                }
                else {
                    return 1;
                }
            }
            else {
                logMessage("Not HORDE!")
                if (params.toxic == "true") {
                    var checkModifier = -5 * wounds;
                    if (randomInteger(100) > (tarData.tough + checkModifier)) {
                        toxicDamage = randomInteger(10);
                        logMessage("Toxic Damaage=" + toxicDamage)
                        wounds += toxicDamage;
                    }

                }
                return wounds;
            }
        }

        // parse all the arguments
        args = msg.content.split("--");
        parseArgs(args);
        logMessage(params);

        getTargetData();
        logMessage(tarData);

        var hits = params.hits.split(";");
        var message = "";
        var woundTotal = 0;
        hits.forEach(hit => woundTotal += determineWounds(hit.split("-")));
        if (params.forceDam && tarData.charType != "HORDE") {
            logMessage(`Found force damage ${params.forceDam}`);
            woundTotal += parseInt(params.forceDam);
        }

        if (params.hordeHits && tarData.charType == "HORDE") {
            logMessage(`Found horde force damage ${params.hordeHits}`);
            woundTotal += parseInt(params.hordeHits);
        }

        if (params.alterBar) {
            if (woundTotal + tarData.currentWounds > tarData.maxWounds) {
                var criticalWounds = (woundTotal + tarData.currentWounds) - tarData.maxWounds;
                sendChat("", `!alter --target|${params.tarTokenID} --bar|1 --amount|${woundTotal}`);
                if (tarData.charType != "HORDE") {
                    sendChat("", `!alter --target|${params.tarTokenID} --bar|3 --amount|${criticalWounds}`);
                }
            }
            else {
                sendChat("", `!alter --target|${params.tarTokenID} --bar|1 --amount|${woundTotal}`);
            }
        }
        else {
            // Since alter bar is not used whisper how much damage.
            sendChat("GM-Wound", `/w gm ${tarData.name} hit for ${woundTotal} ${woundTotal > 1 ? 'wounds' : 'wound'}.`);

            if (tarData.charType == "PLAYER") {
                // send a message to the player letting them know how many wounds they just took.
                sendChat("Wounds", `/w ${tarData.charName} You are hit for ${woundTotal} ${woundTotal > 1 ? 'wounds' : 'wound'}.`);
            }
        }
    }
});