on("ready", function () {
    var version = '1.0.0';
    log("-=> DW_FirstAid v" + version + " Loaded ");
});
on("chat:message", function (msg) {
    if (msg.type == "api" && msg.content.indexOf("!DW_FirstAid") == 0) {
        const showLog = false;

        var params = {}

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

        function readCharacterSheet() {
            var player_obj = getObj("character", params.characterID);
            logMessage(player_obj)

            params["medicaeSkillAdv"] = getAttrByName(params.characterID, "Medicae").replace("@{MedicaeCharacteristic}", "").replace("(", "").replace(")", "").replace("+", "").trim();

            if (params.medicaeSkillAdv == "0") {
                logMessage("Invalid Skill!!!")
            }
            else if (params.medicaeSkillAdv == "") {
                params.medicaeSkillAdv = 0
            }
            else {
                params.medicaeSkillAdv = parseInt(params.medicaeSkillAdv);
            }

            params["int"] = parseInt(getAttrByName(params.characterID, "Intelligence"));
            params["intBonus"] = Math.floor((params.int / 10))
            params["advanceInt"] = parseInt(getAttrByName(params.characterID, "advanceInt"))
            params["bgColor"] = player_obj.get("color");

            var token = findObjs({ type: 'graphic', _id: params.targetID })[0];
            params["targetName"] = "Something";
            if (token) {
                params["targetName"] = token.get("name");
            }
        }

        args = msg.content.split("--");

        // parse all the arguments
        parseArgs(args);

        // read values off the character sheet
        readCharacterSheet();

        // output parameters to the log
        logMessage(params);

        var sendChatMessage = "";
        const scriptCardStart = "!script {{";
        const scriptCardStop = "\n}}";

        sendChatMessage += scriptCardStart;
        sendChatMessage += `\n--#title|${params.characterName} is attempting to heal ${params.targetName}!`;
        sendChatMessage += `\n--#titleCardBackground|${params.bgColor}`;
        sendChatMessage += `\n--#subtitleFontSize|10px`;
        sendChatMessage += `\n--#subtitleFontColor|#000000`;

        sendChatMessage += `\n--=CheckRoll|1d100`;
        sendChatMessage += `\n--=medTest|[Int]${params.int} + [Intadv]${params.advanceInt} + [MedSkillAdv]${params.medicaeSkillAdv} + [Misc]${params.miscModifier} - [Roll][$CheckRoll]`;
        sendChatMessage += `\n--+Skill Check:|[$medTest]`;
        sendChatMessage += `\n--? [$medTest] -gt -1 |[
        --=dos|[$medTest] / 10 {FLOOR} {MAX:4}
        --=intBonus|${params.int}
        --=healValue|1d5r<[$dos] + ${params.intBonus}
        --+Heal:|[$healValue]
        --]|[
        --+Failed to Heal any wounds!|
        --]|`;

        sendChatMessage += scriptCardStop;

        logMessage(sendChatMessage);
        sendChat("From", sendChatMessage);
    }
});