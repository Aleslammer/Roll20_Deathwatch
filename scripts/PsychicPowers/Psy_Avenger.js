on("ready", function () {
    var version = '1.0.0';
    log("-=> Psy_Avenger v" + version + " Loaded ");
});
on("chat:message", function (msg) {
    if (msg.type == "api" && msg.content.indexOf("!Psy_Avenger") == 0) {
        const showLog = true;

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

        function validateIntArgs() {
            params.range = parseInt(params.range);
            params.aim = parseInt(params.aim);
            params.calledShot = parseInt(params.calledShot);
            params.runningTarget = parseInt(params.runningTarget);
            params.miscModifier = parseInt(params.miscModifier);
        }

        function getSide() {
            var sideArray = ["Right", "Left"];
            return sideArray[Math.floor(Math.random() * sideArray.length)];
        }

        function getHit(roll, hitNumber) {

            var hitArray = [
                ["Head", "Head", getSide() + " Arm", "Body", getSide() + " Arm", "Body"],
                ["Right Arm", getSide() + " Arm", "Body", "Head", "Body", getSide() + " Arm"],
                ["Left Arm", getSide() + " Arm", "Body", "Head", "Body", getSide() + " Arm"],
                ["Body", "Body", getSide() + " Arm", "Head", getSide() + " Arm", "Body"],
                ["Right Leg", getSide() + " Leg", "Body", getSide() + " Arm", "Head", "Body"],
                ["Left Leg", getSide() + " Leg", "Body", getSide() + " Arm", "Head", "Body"]
            ];

            var hitSequence;
            if (roll >= 1 && roll <= 10) {
                hitSequence = hitArray[0];
            }
            else if (roll >= 11 && roll <= 20) {
                hitSequence = hitArray[1];
            }
            else if (roll >= 21 && roll <= 30) {
                hitSequence = hitArray[2];
            }
            else if (roll >= 31 && roll <= 70) {
                hitSequence = hitArray[3];
            }
            else if (roll >= 71 && roll <= 85) {
                hitSequence = hitArray[4];
            }
            else if (roll >= 86 && roll <= 100) {
                hitSequence = hitArray[5];
            }

            if (hitNumber >= (hitSequence.length - 1)) {
                hitNumber = (hitSequence.length - 1);
            }

            return hitSequence[hitNumber];
        }

        function reverseRoll(roll) {
            var singles = (roll % 10);
            var tens = (roll - singles);
            return (singles * 10) + (tens / 10);
        }

        function determinePsyRating() {
            switch (params.powerLevel) {
                case "Fettered":
                    params.psyRating = Math.round(params.psyRating * 0.5);
                    break;
                case "Push":
                    params.psyRating = params.psyRating + 3;
                    break;
                default:
                    // Do nothing.
                    break;
            }
        }

        function readCharacterSheet() {
            params["magBonus"] = 0;
            params.psyRating = parseInt(getAttrByName(params.characterID, "PsyRating"));
            // need to determine this now as it effects other values.
            determinePsyRating();
            params["willpower"] = parseInt(getAttrByName(params.characterID, "Willpower"));
            params["willpowerAdv"] = parseInt(getAttrByName(params.characterID, "advanceWP"));

            params["damageRoll"] = `2d10+6`;
            params["damageType"] = "Energy";
            params["penetration"] = params.psyRating * 2;
            params["powerRange"] = 30;
            params["weaponSpecial"] = "Flame (p.260) 1d10+4 per round on fire";

            params["tarAgility"] = parseInt(getAttrByName(params.targetCharID, "Agility"));
            params["tarAgilityAdv"] = parseInt(getAttrByName(params.targetCharID, "advanceAg"));

            params["tarAgRoll"] = (params.tarAgility + params.tarAgilityAdv) - randomInteger(100);
            params["tarAgilityDos"] = Math.trunc(params.tarAgRoll / 10);

            var player_obj = getObj("player", msg.playerid);
            params["bgColor"] = player_obj.get("color");

            var token = findObjs({ type: 'graphic', _id: params.targetID })[0];
            params["targetName"] = "Something";
            if (token) {
                params["targetName"] = token.get("name");
                var value = findObjs({ type: 'attribute', characterid: params.targetCharID, name: "charType" })[0];
                if (value) {
                    params["tarType"] = value.get('current').toUpperCase();
                    if (params.tarType == "HORDE") {
                        // Flamers do more damage to horde
                        params["hordeHits"] = Math.ceil(params.powerRange / 4.0) + randomInteger(5) - 1

                        params["tarMag"] = parseInt(token.get("bar1_max")) - parseInt(token.get("bar1_value"));
                        if (params.tarMag >= 120) {
                            params.magBonus = 60;
                        }
                        else if (params.tarMag >= 90) {
                            params.magBonus = 50;
                        }
                        else if (params.tarMag >= 60) {
                            params.magBonus = 40;
                        }
                        else if (params.tarMag >= 30) {
                            params.magBonus = 30;
                        }
                    }
                }
            }
        }

        function getRange(params) {
            var targetToken = findObjs({ type: 'graphic', _id: params.targetID })[0];
            var sourceToken = findObjs({ type: 'graphic', _id: params.selectedTokenID })[0];



            var distance = getTokenDistance(sourceToken, targetToken)
            params["range"] = 0;

            if (distance.distance <= 2) {
                // Point Blank Range
                params.range = 30;
            }
            else if (distance.distance < (.5 * params.powerRange)) {
                // Short Range
                params.range = 10;
            }
            else if (distance.distance >= (3 * params.powerRange)) {
                // Extreme Range
                params.range = -30;
            }
            else if (distance.distance >= (2 * params.powerRange)) {
                // Long Range
                params.range = -10;
            }
        }

        function getTokenDistance(token1, token2) {
            if (token1.get('pageid') != token2.get('pageid')) {
                logMessage('Cannot measure distance between tokens on different pages');
                return;
            }

            var distX_pixels = Math.abs(token1.get('left') - token2.get('left'));
            var distY_pixels = Math.abs(token1.get('top') - token2.get('top'));

            // 70px = 1 unit
            var distX = distX_pixels / 70;
            var distY = distY_pixels / 70;
            var distance;

            var page = getObj('page', token1.get('pageid'));
            var measurement = page.get('diagonaltype');

            switch (measurement) {
                default:
                case 'pythagorean':
                    // Euclidean distance, that thing they teach you in school
                    distance = Math.sqrt(distX * distX + distY * distY);
                    break;
                case 'foure':
                    // Distance as used in D&D 4e
                    distance = Math.max(distX, distY);
                    break;
                case 'threefive':
                    // Distance as used in D&D 3.5 and Pathfinder
                    distance = 1.5 * Math.min(distX, distY) + Math.abs(distX - distY);
                    break;
                case 'manhattan':
                    // Manhattan distance
                    distance = distX + distY;
                    break;
            }

            var gridUnitSize = page.get('snapping_increment'); // units per grid square
            var unitScale = page.get('scale_number'); // scale for 1 unit, eg 1 unit = 5ft
            var unit = page.get('scale_units'); // unit, eg ft or km

            return {
                distance: distance, // Distance between token1 and token2 in units
                squares: distance / gridUnitSize, // Distance between token1 and token2 in squares
                measurement: '' + (unitScale * distance / gridUnitSize) + unit // Ruler measurement as a string
            };
        }

        function getChatHeader(sendChatMessage) {
            sendChatMessage += `\n--#title|${params.characterName}  summons the warp to burn ${params.targetName} with the Avenger!`;
            sendChatMessage += `\n--#titleCardBackground|${params.bgColor}`;
            sendChatMessage += `\n--#subtitleFontSize|10px`;
            sendChatMessage += `\n--#subtitleFontColor|#000000`;
            sendChatMessage += `\n--#leftsub|Power Level ${params.powerLevel}`;
            sendChatMessage += `\n--#rightsub|PsyRating ${params.psyRating}`;

            return sendChatMessage
        }

        function getTestFailSection(sendChatMessage, params) {
            params["hasFailed"] = false

            if (params.hitRoll > params.failTarget) {
                sendChatMessage += `\n--+DENIED:|${params.hitRoll}`;
                params.hasFailed = true
            }

            return sendChatMessage;

        }

        function getPerilSection(sendChatMessage, params) {

            if ((((params.hitRoll % 11) == 0) && params.powerLevel == "Unfettered") || (params.powerLevel == "Push")) {
                sendChatMessage += `\n--+|[img](https://media.giphy.com/media/L4TNHVeOP0WrWyXT5m/giphy.gif)`;
                sendChatMessage += `\n--+PERIL OF THE WARP!:|Hit Roll - ${params.hitRoll}`;
                sendChatMessage += `\n--+Psychic Phenomena:|[[1d100]]`;
            }
            else {
                sendChatMessage += `\n--+|[img](https://media.giphy.com/media/WprqYyQgk0iGlQ5QzD/giphy.gif)`;
            }

            return sendChatMessage;
        }

        function getNormalAttack(sendChatMessage, params) {
            params.range != 0 ? sendChatMessage += `\n--+Range Modifier:|${params.range}` : null;
            params.aim != 0 ? sendChatMessage += `\n--+Aim Modifier:|${params.aim}` : null;
            params.calledShot != 0 ? sendChatMessage += `\n--+Called Shot Modifier:|${params.calledShot}` : null;
            params.runningTarget != 0 ? sendChatMessage += `\n--+Running Target Modifier:|${params.runningTarget}` : null;
            params.miscModifier != 0 ? sendChatMessage += `\n--+Misc Modifier:|${params.miscModifier}` : null;
            params.magBonus != 0 ? sendChatMessage += `\n--+Horde Size Modifier:|${params.magBonus}` : null;
            sendChatMessage += `\n--+Total Modifier:|${params.fullModifier}`;
            sendChatMessage += `\n--+HitRoll:|${params.hitRoll}`;
            sendChatMessage += `\n--+Hits:|[[${params.hits}]]`;
            params.hits > 0 ? sendChatMessage += `\n--+Damage Type:|${params.damageType}` : null;
            params.tarType == "HORDE" && params.hits > 0 && params.hordeHits > 0 ? sendChatMessage += `\n--+Horde Hits:|[[${params.hordeHits}]]` : null;
            params.hits > 0 ? (params.fullModifier - params.rfRoll > 0 ? sendChatMessage += `\n--+Righteous Fury:|Confirmed` : null) : null;
            if (params.fullModifier - params.rfRoll <= 0) {
                // RF is not confirmed so clear the exploding dice modifier
                params.damageRoll = params.damageRoll.replace("!", "")
            }

            if (params.hits > 0 && params.tarAgilityDos <= 0) {
                sendChatMessage += `\n--+On FIRE!!!|${params.weaponSpecial}`;
            }

            params.hits > 0 ? sendChatMessage += `\n--+Penetration:|${params.penetration}` : null;
            sendChatMessage += `\n--vbetweentokens|${params.selectedTokenID} ${params.targetID} beam-fire`

            var awValue = "";
            for (lcv = 0; lcv < params.hits; lcv++) {
                var whereHit = getHit(reverseRoll(params.hitRoll), lcv);
                sendChatMessage += `\n--=Damage${lcv}|[[${params.damageRoll}]]`;
                sendChatMessage += `\n--+Hit ${lcv + 1}:|${whereHit} for [$Damage${lcv}]`;
                lcv > 0 ? awValue += ";" : null;
                awValue += `${whereHit}-[$Damage${lcv}]`;
            }

            // if we hit then add the hits rolls
            if (params.hits > 0) {
                sendChatMessage += `\n--@DW_ApplyWounds|_targetCharID|${params.targetCharID} _tarTokenID|${params.targetID} _pen|${params.penetration} _hits|${awValue} _alterBar|1 _hordeHits|${params.hordeHits}`;
            }

            return sendChatMessage;
        }

        args = msg.content.split("--");

        // parse all the arguments
        parseArgs(args);

        // Validate the integer arguments
        validateIntArgs();

        // read values off the character sheet
        readCharacterSheet();
        getRange(params)

        params["fullModifier"] = params.willpower + params.willpowerAdv + params.range + params.aim + params.calledShot + params.runningTarget + params.miscModifier + (5 * params.psyRating) + params.magBonus;

        // Determine the Jam target.
        params["jamTarget"] = 91;

        // Determine hits and RF roll.
        params["hitRoll"] = randomInteger(100);
        params["rfRoll"] = randomInteger(100);
        params["hitsTotal"] = Math.floor((params.fullModifier - params.hitRoll) / 10);
        params["hits"] = params.hitsTotal >= 0 ? 1 : 0;

        // output parameters to the log
        logMessage(params);

        var sendChatMessage = "";
        var sendChatMessage = "!script {{";
        sendChatMessage = getChatHeader(sendChatMessage)
        sendChatMessage = getTestFailSection(sendChatMessage, params)
        if (!params.hasFailed) {
            sendChatMessage = getPerilSection(sendChatMessage, params)
            sendChatMessage = getNormalAttack(sendChatMessage, params)
        }

        sendChatMessage += "\n}}";

        logMessage(sendChatMessage);
        sendChat("From", sendChatMessage);
    }
});