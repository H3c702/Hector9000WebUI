const DM_State = {
    'CLOSED': 0,
    'OPENING': 1,
    'LOADING': 2,
    'RUNNING': 3,
    'REQUESTING': 4,
    'DOSING': 5,
    'CLOSING': 6
};

const MM_State = {
    'CLOSED': 0,
    'OPENING': 1,
    'RUNNING': 2,
    'FIXED': 3,
    'CLOSING': 4,
};

var started = false;
var DM_status = DM_State.CLOSED;
var MM_status = MM_State.CLOSED;

var displays = [];
var displaystate = 0;
var mqtt;

const host = "localhost";
const port = 9001;


const TopicDrinkList = "Hector9000/get_drinks";
const TopicIngredients = "Hector9000/get_ingredientsForDrink";
const TopicDose = "Hector9000/doseDrink";
const TopicClean = "Hector9000/cleanMe";
const TopicDry = "Hector9000/dryMe";
const TopicOpenAllValves = "Hector9000/openAllValves";
const TopicCloseAllValves = "Hector9000/closeAllValves";

//--------- Testing start ---------------

const testing = false;

var drinkjson = '{ "id": "123", "name": "Getränk","color": "#999999",' +
    '"description": "Ein Getränk",' +
    '"ingredients": [' +
    '{"name": "Cola", "ammount": 150},' +
    '{"name": "Club-Mate", "ammount": 100},' +
    '{"name": "Rum", "ammount": 50},' +
    '{"name": "Wasser", "ammount": 200},' +
    '{"name": "O-Saft", "ammount": 10}' +
    ']' +
    '}';
    
var jsont = '{"drinks": [{"name": "Tequilla Sunrise","id": 123, "alcohol": true},{"name": "bla2","id": 123, "alcohol": false},{"name": "bla3","id": 123, "alcohol": false},{"name": "bla4","id": 123, "alcohol": false},{"name": "bla5","id": 123, "alcohol": true},{"name": "bla6","id": 123, "alcohol": true},{"name": "bla7","id": 123, "alcohol": false}]}';

//--------- Testing end ---------------

function generateButton(name, id, alc) {
    shtml = '<div onclick="openDrinkModal(this)" class="button ';
    if (alc) {
        shtml += 'alc';
    }
    shtml += '" d_id="' + id + '" d_name="' + name + '"><div class="name">' + name + "</div></div>";
    return shtml;
}

function generateButtons(drinksjson) {
started = true;
    var json = JSON.parse(drinksjson);
    jl = json.drinks.length;
    cont = document.getElementById("content");
    count = 0;
    teiler = parseInt(jl / 6);
    for (i = 0; i < parseInt(jl / 6); i++) {
        count++;
        html = '<div class="buttons" id="id' + (i + 1) + '">';
        html += '<div class="row r1">';
        for (j = 0; j < 3; j++) {
            html += generateButton(json.drinks[(6 * i + j)].name, json.drinks[(6 * i + j)].id, json.drinks[(6 * i + j)].alcohol);
        }
        html += '</div><div class="row r2">';
        for (j = 0; j < 3; j++) {
            html += generateButton(json.drinks[(6 * i + 3 + j)].name, json.drinks[(6 * i + 3 + j)].id, json.drinks[(6 * i + 3 + j)].alcohol);
        }
        html += '</div></div>';
        cont.innerHTML += html;
        displays.push("id" + (i + 1));
    }
    rest = json.drinks.length % 6;
    ammont = (teiler * 6);
    if (rest > 0) {
        ct = 0;
        html = '<div class="buttons" id="id' + (count + 1) + '"><div class="row r1">';
        if (rest >= 4) {
            for (i = 0; i < 3; i++) {
                html += generateButton(json.drinks[(ammont + i)].name, json.drinks[(ammont + i)].id, json.drinks[(ammont + i)].alcohol);
            }
            html += '</div><div class="row r2">';
            ct = 3;
        }
        do {
            html += generateButton(json.drinks[(ammont + ct)].name, json.drinks[(ammont + ct)].id, json.drinks[(ammont + ct)].alcohol);
            ct++;
        } while (ct < rest);
        html += '</div></div>';
        cont.innerHTML += html;
        displays.push("id" + (count + 1));
    }
    for (i = 0; i < displays.length; i++) {
        document.getElementById(displays[i]).style.right = "" + (-i * 100 + 10) + "%";
    }
    document.addEventListener('keydown', keydown);
    document.getElementById("loading").className = "inv";
}

function startup() {
    if (testing) {
        started = true;
        generateButtons(jsont);
    } else {
        setUpMQTT();
    }
}

// Mainmodal
function openModal() {
    if (MM_status === MM_State.CLOSED) {
        let main_modal = document.getElementById("mainModal");
        main_modal.className = "modal open";
        MM_status = MM_State.OPENING;
        setTimeout(function () {
            openModalBack();
            MM_status = MM_State.RUNNING;
        }, 1100);
    }
}

function closeModal() {
    if (MM_status === MM_State.RUNNING) {
        let main_modal = document.getElementById("mainModal");
        main_modal.className = "modal trans";
        setTimeout(function () {
            document.getElementById("mod-config").className = "inv";
            document.getElementById("mod-drink").className = "inv";
        }, 300);
        setTimeout(function () {
            main_modal.className = "modal";
            closeModalBack();
            MM_status = MM_State.CLOSED;
        }, 1000);
        MM_status = MM_State.CLOSING;
    }
}

function closeEitherModal() {
    if (MM_status === MM_State.RUNNING) {
        if (DM_status !== DM_State.CLOSED) {
            closeDrinkModal();
        } else {
            closeConfigModal();
        }
    }
}

// Drinkmodal
function resetDM() {
    document.getElementById("DM_name").innerHTML = "";
    document.getElementById("DM_List").innerHTML = "<div id=\"DM_ing_loader\"><div><div class=\"lds-roller\"><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div></div></div></div>";
    document.getElementById("DM_zubereiten").onclick = function () {
    };
    document.getElementById("DM_zubereiten").disabled = true;
    document.getElementById("mod-drink").setAttribute("d_id", "");
}

function closeDrinkModal() {
    if (DM_status === DM_State.RUNNING || DM_status === DM_State.LOADING) {
        DM_status = DM_State.CLOSING;
        closeModal();
        setTimeout(function () {
            document.getElementById("DM_ing_loader").className = "";
            resetDM();
            DM_status = DM_State.CLOSED;
        }, 1000)
    }
}

function openDrinkModal(drinkinfo) {
    if (MM_status === MM_State.CLOSED) {
        openModal();
        DM_status = DM_State.OPENING;
        setTimeout(function () {
            document.getElementById("mod-drink").className = "";
        }, 700);
        let d_name = "<u>" + drinkinfo.getAttribute("d_name");
        if (drinkinfo.className.includes("alc")) {
            d_name += "  (alc) ";
        }
        d_name += "</u>";
        document.getElementById("DM_name").innerHTML = d_name;
        document.getElementById("mod-drink").setAttribute("d_id", drinkinfo.getAttribute("d_id"));
        if (testing) {
            DM_status = DM_State.LOADING;
            setTimeout(showIngredientsAndButton(drinkjson), 800);
        } else {
            DM_status = DM_State.LOADING;
    publish(TopicIngredients, drinkinfo.getAttribute("d_id"));
        }
    }
}

function showIngredientsAndButton(json) {
    let drinkinfo = JSON.parse(json);
console.log(drinkinfo);
console.log(document.getElementById("mod-drink"));
    if (drinkinfo.id != document.getElementById("mod-drink").getAttribute("d_id")) {
        console.log("not doing stuff");
    return;
    }
    if (DM_status === DM_State.LOADING) {
    console.log("doing stuff");
        document.getElementById("DM_ing_loader").className = "inv";
        document.getElementById("DM_zubereiten").disabled = false;
        document.getElementById("DM_zubereiten").onclick = function () {
            doseDrink(drinkinfo.id);
        };
        for (let i = 0; i < drinkinfo.ingredients.length; i++) {
            document.getElementById("DM_List").innerHTML += '<div class="DM_ing"><div class="DM_ing_amm">' + drinkinfo.ingredients[i].ammount + 'ml</div><div class="DM_ing_name">' + drinkinfo.ingredients[i].name + '</div></div>';
        }
        DM_status = DM_State.RUNNING;
    }
console.log(DM_status);
}


// Configmodal
function resetCM() {
    //Nothing to reset yet
}

function closeConfigModal() {
    if (MM_status === MM_State.RUNNING && DM_status === DM_State.CLOSED) {
        closeModal();
        setTimeout(function () {
            resetCM();
        }, 1000)
    }
}

function openConfigModal() {
    if (MM_status === MM_State.CLOSED) {
        openModal();
        setTimeout(function () {
            document.getElementById("mod-config").className = "";
        }, 700);
    }
}


// Modalback
function openModalBack() {
    document.getElementById("modalclose").className = "";
}

function closeModalBack() {
    document.getElementById("modalclose").className = "MC_cls";
}

function doseDrink(id) {
    if (DM_status === DM_State.RUNNING) {
        if (testing) {
            MM_status = MM_State.FIXED;
            DM_status = DM_State.DOSING;
            //alert("TESTING - DOSING DRINK");
            document.getElementById("DM_zubereiten_loading").className = "";
            document.getElementById("DM_zubereiten").className = "DM_button loader_active";
            setTimeout(function () {
                document.getElementById("DM_abbruch").className = "DM_button dis";
                document.getElementById("DM_zubereiten").className = "DM_button dis";
                setTimeout(function () {
                    document.getElementById("DM_abbruch").className = "DM_button inv";
                    document.getElementById("DM_zubereiten").className = "DM_button inv";
                    document.getElementById("DM_dose_bar").className = "";
                    updateDosingState(id, 5);
                }, 500);
            }, 3000);
            setTimeout(function () {
                document.getElementById("DM_zubereiten_loading").className = "inv";
                document.getElementById("DM_zubereiten").className = "DM_button";
                doseEnded()
            }, 30000);
        } else {
            DM_status = DM_State.REQUESTING;
            publish(TopicDose, id.toString());
            document.getElementById("DM_zubereiten_loading").className = "";
            document.getElementById("DM_zubereiten").className = "DM_button loader_active";
    setTimeout(function(){doseStart("abc");}, 1000);
        }
    }
}

function doseStart(id) {
    if (DM_status === DM_State.REQUESTING) {
        DM_status = DM_State.DOSING;
        document.getElementById("DM_buttons").className = "dis";
    console.log("start");
        setTimeout(function () {
            document.getElementById("DM_zubereiten").className = "DM_button inv";
            document.getElementById("DM_abbruch").className = "DM_button inv";
            document.getElementById("DM_dose_bar").className = "";
            document.getElementById("DM_zubereiten_loading").className = "inv";
    }, 500)}
   // setTimeout(function(){doseEnded();}, 45000);
}

function updateDosingState(update) {
    console.log("update " + update); 
    if (DM_status === DM_State.DOSING){
        let inner = document.getElementById("inner_bar");
        update = update.split(".")[0];
        inner.style.width = update + "%";
        inner.getElementsByTagName("div")[0].innerText = update + "%";
    }
}

function doseEnded() {
    if (DM_status === DM_State.DOSING) {
        DM_status = DM_State.RUNNING;
        MM_status = MM_State.RUNNING;
        closeDrinkModal();
        setTimeout(function () {
            document.getElementById("DM_zubereiten").className = "DM_button";
            document.getElementById("DM_abbruch").className = "DM_button";
            document.getElementById("DM_dose_bar").className = "dis inv";
        }, 600);
    }

}

//Keyevents

function keydown(e) {
    if (e.code === "ArrowRight" || e.code === "KeyD") {
        right();
    } else if (e.code === "ArrowLeft" || e.code === "KeyA") {
        left();
    }
}

function right() {
    if (MM_status === MM_State.RUNNING) {
        closeEitherModal();
    } else if (MM_status !== MM_State.CLOSED) {
    } else if (displaystate < displays.length - 1) {
        displaystate++;
        for (i = 0; i < displays.length; i++) {
            rg = "" + ((-i + displaystate) * 100 + 10) + "%";
            document.getElementById(displays[i]).style.right = rg;
        }
    } else if (displaystate === displays.length - 1) {
        displaystate = 0;
        for (i = 0; i < displays.length; i++) {
            rg = "" + ((-i + displaystate) * 100 + 10) + "%";
            document.getElementById(displays[i]).style.right = rg;
        }
    }
}

function left() {
    if (MM_status === MM_State.RUNNING) {
        closeEitherModal();
    } else if (MM_status !== MM_State.CLOSED) {
    } else if (displaystate > 0) {
        displaystate--;
        for (i = 0; i < displays.length; i++) {
            rg = "" + ((-i + displaystate) * 100 + 10) + "%";
            document.getElementById(displays[i]).style.right = rg;
        }
    } else if (displaystate === 0) {
        displaystate = displays.length - 1;
        for (i = 0; i < displays.length; i++) {
            rg = "" + ((-i + displaystate) * 100 + 10) + "%";
            document.getElementById(displays[i]).style.right = rg;
        }
    }
}

//MQTT

function IngredientSubscriber(payload) {
console.log("ingredientsub");
    if(DM_status === DM_State.LOADING){
        showIngredientsAndButton(payload);
    }
}

function DrinkSubscriber(payload) {
    if(!started){
        generateButtons(payload);
    }
}

function DoseStartSubscriber(payload) {
  // console.log(payload);
  // console.log(document.getElementById("mod-drink").getAttribute("d_id"));
    if (DM_status === DM_State.REQUESTING && payload == document.getElementById("mod-drink").getAttribute("d_id")){
        doseStart(payload);
    console.log("id was equal in startsubscriber");
    }
}

function publish(topic, payload) {
console.log("publish-t: " + topic);
console.log("publish-m: " + payload);
    message = new Paho.MQTT.Message(payload);
    message.destinationName = topic;
    mqtt.send(message);
}

function DrinkProcessSubscriber(payload) {
if (DM_status === DM_State.DOSING) {
        if (payload == "end" || payload.startsWith("100")) {
            doseEnded();
        } else {
            updateDosingState(payload);
        }
    }
}

function messageArrived(msg) {
publish("logging", msg.destinationName + " - " + msg.payloadString);
console.log("topic: " + msg.destinationName);
console.log("payload: " + msg.payloadString);
    let topic = msg.destinationName;
    if (topic === TopicDrinkList + "/return") {
        DrinkSubscriber(msg.payloadString);
    } else if (topic === TopicIngredients + "/return") {
        IngredientSubscriber(msg.payloadString);
    } else if (topic === TopicDose + "/return") {
        DoseStartSubscriber(msg.payloadString);
    } else if (topic === TopicDose + "/progress") {
        DrinkProcessSubscriber(msg.payloadString);
    }
}

function onConnect() {
    mqtt.subscribe(TopicDrinkList + "/return");
    mqtt.subscribe(TopicIngredients + "/return");
    mqtt.subscribe(TopicDose + "/progress");
    mqtt.subscribe(TopicDose + "/return");
publishatstart();
}

function publishatstart(){
if(!started){
    publish(TopicDrinkList, "true");
    setTimeout(function e(){ publishatstart();},5000);
}	
}

function setUpMQTT() {
    mqtt = new Paho.MQTT.Client(host, port, "HectorFrontend");
    var options = {timeout: 3, onSuccess: onConnect,};
    mqtt.onMessageArrived = messageArrived;
    mqtt.connect(options);
}
