on("ready", function () {
    var version = '1.0.0';
    log("-=> DW_ReduceAmmo v" + version + " Loaded ");
});
on("chat:message", function (msg) {
    if (msg.type == "api" && msg.content.indexOf("!DW_ReduceAmmo") == 0) {
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

        function validateArgs() {
            params.amount = parseInt(params.amount);
        }

        function findWeaponID() {
            var myRow = findObjs({ type: 'attribute', characterid: params.characterID }).filter(x => x.get("name").includes("rw_row_id") && x.get("current") == params.weaponID)[0];
            if (myRow) {
                var myRowID = myRow.get("name").replace("repeating_rangedweapons_", "");
                myRowID = myRowID.replace("_rw_row_id", "");
                params.weaponRowID = myRowID;
            }
            else {
                logMessage("Cannot find weapon for " + params.characterName + " (" + params.characterID + ") and row id " + params.weaponID, true);
            }
        }

        function getWeaponValue(name, isRequired) {
            var attrName = "repeating_rangedweapons_" + params.weaponRowID + "_" + name;
            var myRow = findObjs({ type: 'attribute', characterid: params.characterID, name: attrName })[0]
            if (myRow) {
                return myRow.get("current");
            }
            else {
                if (isRequired) {
                    logMessage("Missing Row for " + attrName);
                    return "Unknown";
                }
                else {
                    return "";
                }
            }
        }

        function getWeaponValues() {

            params["weaponSpecial"] = getWeaponValue("rangedweaponspecial", false);

            params["living_ammo"] = false
            if (params.weaponSpecial.toLowerCase().includes("living ammo")) {
                logMessage("Adding Living Ammo")
                params.living_ammo = true
            }
        }

        function reduceAmmo(amount) {
            if (!params.living_ammo) {
                var myRow = findObjs({ type: 'attribute', characterid: params.characterID }).filter(x => x.get("name").includes("rw_row_id") && x.get("current") == params.weaponID)[0];
                if (myRow) {
                    var attrName = "repeating_rangedweapons_" + params.weaponRowID + "_rangedweaponclip";
                    var myRow = findObjs({ type: 'attribute', characterid: params.characterID, name: attrName })[0]
                    if (myRow) {
                        var currentValue = parseInt(myRow.get("current"));
                        logMessage("Reducing ammo for " + attrName + " by " + amount)
                        myRow.set("current", currentValue - amount)
                    }
                    else {
                        logMessage("Missing Row for " + attrName, true);
                    }
                }
                else {
                    logMessage("Missing Row for Ammo Update on " + params.characterName, true);
                }
            }
        }

        args = msg.content.split("--");

        logMessage("In ReduceAmmo");
        // parse all the arguments
        parseArgs(args);

        // Validate the integer arguments
        validateArgs();

        // output parameters to the log
        logMessage(params);

        findWeaponID();
        getWeaponValues();
        reduceAmmo(params.amount);
    }
});