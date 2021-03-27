on("ready", function () {
    var version = '0.2.0';
	log("-=> DW_ApplyWounds v" + version + " Loaded ");
});
on("chat:message", function(msg){
    if (msg.type=="api" && msg.content.indexOf("!DW_ApplyWounds") == 0)
    {
        const showLog = false;

        var params = {}
        var tarData = {}

        function logMessage(message, override = false)
        {
            if (showLog || override)
            {
                log(message)
            }
        }

        function parseArgs(args){
            for(lcv = 1; lcv < args.length; lcv++)
            {
                var splitValue = args[lcv].trim().split("|");
                var key = splitValue[0];
                var value = splitValue[1];
                params[key] = value;
            }
        }

        function getTargetData()
        {
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
            var value = findObjs({type: 'attribute', characterid: params.targetCharID, name: "charType"})[0];
            if (value)
            {
                tarData["charType"] = value.get('current').toUpperCase();
            }

            tarData["charName"] = getAttrByName(params.targetCharID, "character_name");
            tarData["name"] = tarData.charName;
            var token = findObjs({ type: 'graphic', _id: params.tarTokenID })[0];
            if (token)
            {
                tarData["name"] = token.get("name");
            }

            tarData["TB"] = Math.floor(tarData.tough / 10);
            if (tarData.toughMult > 0)
            {
                tarData.TB = tarData.TB * tarData.toughMult;
            }
        }

        function determineWounds(hit)
        {
            var location = hit[0];
            var damage = hit[1];
            var armourValue = tarData[location] - parseInt(params.pen);
            var wounds = damage - (armourValue > 0 ? armourValue : 0) - tarData.TB;
            logMessage(`Dam:${damage}, ArmourValue:${armourValue}, TB:${tarData.TB}`);
            if (tarData.charType == "HORDE")
            {
                logMessage("HORDE!")
                return 1;
            }
            else
            {
                logMessage("Not HORDE!")
                return wounds > 0 ? wounds : 0;
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
        if (params.alterBar)
        {
            message = `\n!alter --target|${params.tarTokenID} --bar|1 --amount|-${woundTotal} --show|gm`
        }
        else
        {
            // Since alter bar is not used whisper how much damage.
            sendChat("GM-Wound", `/w gm ${tarData.name} hit for ${woundTotal} ${woundTotal > 1?'wounds':'wound'}.` );

            if (tarData.charType == "PLAYER")
            {
                // send a message to the player letting them know how many wounds they just took.
                sendChat("Wounds", `/w ${tarData.charName} You are hit for ${woundTotal} ${woundTotal > 1?'wounds':'wound'}.`);
            }
        }
    }
});