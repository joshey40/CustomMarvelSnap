const CARDS_API_URL = "https://marvelsnapzone.com/getinfo/?searchtype=cards&searchcardstype=true"
const LOCATIONS_API_URL = "https://marvelsnapzone.com/getinfo/?searchtype=locations&searchcardstype=true"

var officialCards;
var customCards;

const http = new XMLHttpRequest()

http.open("GET", CARDS_API_URL)
http.send()

http.onload = () => console.log(http.responseText)

// effectTags

var effectTags = [];

function addAllEffectTags() {
    for (var key in officialCards) {
        var card = officialCards[key];
        if (card.effectTags != null) {
            for (var i = 0; i < card.effectTags.length; i++) {
                if (!effectTags.includes(card.effectTags[i])) {
                    effectTags.push(card.effectTags[i]);
                }
            }
        }
    }
    effectTags.sort();
    var effectTagsSelect = document.getElementById("effect-tag");
    effectTagsSelect.innerHTML = "";
    for (var i = 0; i < effectTags.length; i++) {
        var option = document.createElement("option");
        option.value = effectTags[i];
        option.textContent = effectTags[i];
        effectTagsSelect.appendChild(option);
    }
}

// Custom Characters List

var customCharacters = [];

function addAllCustomCharacters() {
    for (var key in customCards) {
        var card;
        card.name = customCards[key].name;
        card.id = customCards[key].id;
        customCharacters.push(card);
    }
    var exampleCard = {
        name: "Example Character",
        id: "example_character"
    };
    var exampleCard2 = {
        name: "Test Character",
        id: "test_character"
    };
    customCharacters.push(exampleCard);
    customCharacters.push(exampleCard2);
}

// Filtersystem

var filters = {
    search: "",
    cardtype: "All",
    sources: "All",
    effectTags: [],
    order: "Name",
    orderAscend: false
};

var filterRunning = false;

function changeSearch() {
    filters.search = document.getElementById("search").value;
    
    applyFilters();
}

function changeCardType() {
    filters.cardtype = document.getElementById("cardTypeSelect").value;

    applyFilters();
}

function changeSource() {
    filters.sources = document.getElementById("sourceSelect").value;

    applyFilters();
}

function clearFilters() {
    document.getElementById("search").value = "";
    document.getElementById("cardTypeSelect").value = "All";
    document.getElementById("sourceSelect").value = "All";
    document.getElementById("effect-tags").innerHTML = "";
    document.getElementById("character-tags").innerHTML = "";
    document.getElementById("order").value = "Name";
    filters = {
        search: "",
        cardtype: "All",
        sources: "All",
        effectTags: [],
        order: "Name",
        orderAscend: false
    };

    applyFilters();
}

function changeOrder() {
    filters.order = document.getElementById("order").value;

    applyFilters();
}

function ascendOrder() {
    filters.orderAscend = true;
    
    applyFilters();
}

function descendOrder() {
    filters.orderAscend = false;

    applyFilters();
}

function addEffectTagFilter() {
    var tag = document.getElementById("effect-tag").value;
    var tagDiv = document.createElement("div");
    tagDiv.textContent = tag;
    tagDiv.classList.add("tagsDiv");

    if (filters.effectTags.indexOf(tag) == -1) {
        filters.effectTags.push(tag);
        var deleteButton = document.createElement("button");
        deleteButton.textContent = "X";
        deleteButton.classList.add("tagsDivDelete");
        deleteButton.onclick = function() {
            tagDiv.remove();
            filters.effectTags.splice(filters.effectTags.indexOf(tag), 1);
            applyFilters();
        };
        tagDiv.appendChild(deleteButton);
    
        document.getElementById("effect-tags").appendChild(tagDiv);

        applyFilters();
    }
}

async function applyFilters() {
    if (filterRunning) {
        return;
    }
    filterRunning = true;

    var cards = [];
    for (var key in officialCards) {
        var card = officialCards[key];
        card.custom = false;
        cards.push(card);
    }

    var filteredCards = cards.filter(function(card) {
        return (card.name.toLowerCase().includes(filters.search.toLowerCase())
        || card.text.toLowerCase().includes(filters.search.toLowerCase()))
        && (filters.cardtype == "All" || card.cardtype == filters.cardtype)
        && (filters.sources == "All" || (filters.sources == "custom" && card.custom) || (filters.sources == "official" && !card.custom))
        && (filters.effectTags.length == 0 || (card.effectTags && filters.effectTags.every(tag => card.effectTags.includes(tag))));
    });

    if (filters.order == "Name") {
        filteredCards.sort((a, b) => a.name.localeCompare(b.name));
    } else if (filters.order == "Cost") {
        filteredCards.sort((a, b) => a.cost - b.cost);
    } else if (filters.order == "Power") {
        filteredCards.sort((a, b) => a.power - b.power);
    }

    if (filters.orderAscend) {
        filteredCards.reverse();
    }
    
    var characterListDiv = document.getElementById("cards-div");
    characterListDiv.innerHTML = "";
    for (var i = 0; i < filteredCards.length; i++) {
        displayCard(filteredCards[i], characterListDiv);
    }

    filterRunning = false;
}

// Card Display

async function displayCard(card, characterListDiv) {
    var cardDiv = document.createElement("div");
    cardDiv.classList.add("cardDiv");
    cardDiv.setAttribute("data-character", JSON.stringify(card));
    cardDiv.onclick = async function() {
        while (filterRunning) {
            document.getElementById("loading").style.visibility = "visible";
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        document.getElementById("loading").style.visibility = "hidden";
        closeCreateCardPopup();
        closeCreateCharacterPopup();
        document.getElementById("popup").style.visibility = "visible";
        var card = JSON.parse(this.getAttribute("data-character"));
        document.getElementById("popupTitle").textContent = card.name;
        document.getElementById("popupImgDiv").innerHTML = "";
        var img = await generateCharcterImage(card, 500);
        document.getElementById("popupImgDiv").appendChild(img);
        if (card.custom) {
            var downloadButton = document.createElement("button");
            downloadButton.setAttribute("data-character", JSON.stringify(card));
            downloadButton.textContent = "Download Image";
            downloadButton.classList.add("popupDownloadImgBtn");
            downloadButton.onclick = function() {
                var link = document.createElement("a");
                link.setAttribute("download", card.id + ".png");
                console.log(document.getElementById("popupImgDiv"));
                link.setAttribute("href", document.getElementById("popupImgDiv").getElementsByTagName("canvas")[0].toDataURL("image/png").replace("image/png", "image/octet-stream"));
                link.click();
            };
            document.getElementById("popupImgDiv").appendChild(downloadButton);
        }
        document.getElementById("popupDesc-cardtype").textContent = card.cardtype;
        document.getElementById("popupDesc-cost&power").textContent = "Cost: " + card.cost + " Power: " + card.power;
        document.getElementById("popupDesc-text").textContent = card.text;
        document.getElementById("popupDesc-effecttags").innerHTML = "";
        if (card.effectTags != null && card.effectTags.length > 0) {
            for (var j = 0; j < card.effectTags.length; j++) {
                var tag = document.createElement("div");
                tag.textContent = card.effectTags[j];
                tag.classList.add("tagsDiv");
                document.getElementById("popupDesc-effecttags").appendChild(tag);
            }
        } else {
            var tag = document.createElement("div");
            tag.textContent = "None";
            tag.classList.add("tagsDiv");
            document.getElementById("popupDesc-effecttags").appendChild(tag);
        }
        if (card.custom) {
            document.getElementById("popupDesc-source").textContent = "Custom";
        } else {
            document.getElementById("popupDesc-source").textContent = "Marvel Snap";
        }
        document.getElementById("popupDesc-source").onclick = function() {
            window.open(card.cardSource, "_blank");
        };
    };
    // Image
    var cardImgDiv = document.createElement("div");
    cardImgDiv.style = "width: 200px; height: 200px;";
    cardImgDiv.appendChild(await generateCharcterImage(card, 200));
    cardDiv.appendChild(cardImgDiv);
    // Text
    var cardTextDiv = document.createElement("div");
    cardTextDiv.classList.add("cardTextDiv");
    cardTextDiv.textContent = card.text;
    cardDiv.appendChild(cardTextDiv);
    // Complete
    characterListDiv.appendChild(cardDiv);
}

async function generateCharcterImage(character, size) {
    if (character[11] == "custom") {
        return await generateCustomCharacter("/img/default_cards/ghost_rider.png", null, null, character, "common", "none", size);
    } else {
        var canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        var ctx = canvas.getContext("2d");
        var img = new Image();
        img.onload = function() {
            ctx.drawImage(img, 0, 0, size, size);
        };
        img.src = character.imageSource;
        return canvas;
    }
}

async function generateCustomCharacter (backgroundImgSrc, foregroundImgSrc, LogoImgSrc, character, rarity, visualEffect, size) {
    // Create Canvas
    var canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    ctx = canvas.getContext("2d");
    // Art_Mask
    var artMask = await getImg("/img/default_cards/art_mask.png");
    ctx.drawImage(artMask, 0, 0, size, size);
    // Background
    var backgroundImg = await getImg(backgroundImgSrc);
    ctx.globalCompositeOperation = "source-in";
    var w = backgroundImg.width;
    var h = backgroundImg.height;
    var aspectRatio = w / h;
    w = 596;
    h = w / aspectRatio;
    if (h < 842) {
        h = 842;
        w = h * aspectRatio;
    }
    var scale = size / 1024;
    w *= scale;
    h *= scale;
    x = 214 * scale;
    y = 88 * scale;
    ctx.drawImage(backgroundImg, x, y, w, h);
    // Visual Effect
    if (visualEffect != "none") {
        var effect = await getImg("/img/effects/" + visualEffect + ".png");
        ctx.globalCompositeOperation = "source-out";
        ctx.drawImage(effect, 0, 0, size, size);
    }
    // Foreground and Frame
    ctx.globalCompositeOperation = "source-over";
    if (rarity == "common") {
        if (foregroundImgSrc != null) {
            var foregroundImg = await getImg(foregroundImgSrc);
            ctx.drawImage(foregroundImg, 0, 0, size, size);
        }
        var frame = await getImg("/img/frames/frame_" + rarity + ".png");
        ctx.drawImage(frame, 0, 0, size, size);
    } else {
        var frame = await getImg("/img/frames/frame_" + rarity + ".png");
        ctx.drawImage(frame, 0, 0, size, size);
        if (foregroundImg != null) {
            var foregroundImg = await getImg(foregroundImgSrc);
            ctx.drawImage(foregroundImg, 0, 0, size, size);
        }
    }
    // Name/Logo
    if (LogoImgSrc != null) {
        var logoImg = await getImg(LogoImgSrc);
        ctx.drawImage(logoImg, 0, 0, size, size);
    } else {
        // Generate Logo with character name
        var name = character.name.toUpperCase();
        var fontSize = size * 0.18;
        if (name.length > 15) {
            fontSize = size * 0.06;
        } else if (name.length > 10) {
            fontSize = size * 0.08;
        } else if (name.length > 5) {
            fontSize = size * 0.12;
        }
        ctx.font = "bold " + fontSize + "px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";
        ctx.fillStyle = "white";
        ctx.strokeStyle = "black"; // Add black outline
        ctx.lineWidth = 5; // Set outline width
        ctx.strokeText(name, size / 2, size); // Draw outlined text
        ctx.fillText(name, size / 2, size);
    }
    // TODO: Add Cost and Power
    
    return canvas;
}

function getImg (src) {
    var img = new Image();
    img.src = src;
    return new Promise((resolve, reject) => {
        img.onload = () => resolve(img);
        img.onerror = reject;
    });
}

// Popup

function closePopup() {
    document.getElementById("popup").style.visibility = "hidden";
}

function closeCreateCardPopup() {
    document.getElementById("popupCreateCard").style.visibility = "hidden";
    var createCharacterDiv = document.getElementById("popupCreateCardCharacterOrVariant");
    createCharacterDiv.style.visibility = "hidden";
    var createCharacterPropertiesDiv = document.getElementById("popupCreateCardProperties");
    createCharacterPropertiesDiv.style.visibility = "hidden";
}

function openCreateCardPopup() {
    closeCreateCharacterPopup();
    closePopup();
    document.getElementById("popupCreateCard").style.visibility = "visible";
    // Card Name Options
    const datalist = document.getElementById("characterNamesForCard");
    datalist.innerHTML = "";
    for (var i = 0; i < customCharacters.length; i++) {
        var option = document.createElement("option");
        option.value = customCharacters[i].name;
        datalist.appendChild(option);
    }
    // Effect Tags
    var effectTagsSelect = document.getElementById("popupCreateCardEffectTag");
    effectTagsSelect.innerHTML = "";
    for (var i = 0; i < effectTags.length; i++) {
        var option = document.createElement("option");
        option.value = effectTags[i];
        option.textContent = effectTags[i];
        effectTagsSelect.appendChild(option);
    }
    // Reset Custom Card
    customCard = {
        name: "",
        id: "",
        cardtype: "Card",
        cost: 0,
        power: 0,
        text: "",
        effectTags: [],
        cardSource: "",
    };
    // Name
    document.getElementById("popupCreateCardName").value = customCard.name;
    document.getElementById("popupCreateCardType").value = customCard.cardtype;
    document.getElementById("popupCreateCardCost").value = customCard.cost;
    document.getElementById("popupCreateCardPower").value = customCard.power;
}

function closeCreateCharacterPopup() {
    document.getElementById("popupCreateCharacter").style.visibility = "hidden";
}

function openCreateCharacterPopup() {
    closeCreateCardPopup();
    closePopup();
    document.getElementById("popupCreateCharacter").style.visibility = "visible";
    // Card Name Options
    const datalist = document.getElementById("characterNamesForCharacter");
    datalist.innerHTML = "";
    for (var i = 0; i < customCharacters.length; i++) {
        var option = document.createElement("option");
        option.value = customCharacters[i].name;
        datalist.appendChild(option);
    }
    // Reset Custom Character
    customCharcater = {
        name: "",
        id: "",
    };
    // Name
    customCharcater.name = customCard.name;
    customCharcater.id = customCard.id;
    document.getElementById("popupCreateCharacterName").value = customCharcater.name;
}

// Create Custom Character

var customCharcater = {
    name: "",
    id: "",
};

function changeCreateCharacterName() {
    customCharcater.name = document.getElementById("popupCreateCharacterName").value;
    customCharcater.id = customCharcater.name.toLowerCase().replace(" ", "_");

    applyCreateCharacter();
}

function applyCreateCharacter() {
    // TODO: Add character preview
    console.log(customCharcater);
}

// Create Custom Card

var customCard = {
    name: "",
    id: "",
    cardtype: "Card",
    cost: 0,
    power: 0,
    text: "",
    effectTags: [],
    cardSource: "",
};

function changeCreateCardName() {
    customCard.name = document.getElementById("popupCreateCardName").value;
    customCard.id = customCard.name.toLowerCase().replace(" ", "_");
    // Check if character exists
    if (customCard.name != "") {
        var createCharacterDiv = document.getElementById("popupCreateCardCharacterOrVariant");
        createCharacterDiv.style.visibility = "visible";
        if (customCharacters.find(character => character.name == customCard.name) != null) {
            var createCharacterDivText = document.getElementById("popupCreateCardCharacterOrVariantText");
            createCharacterDivText.textContent = "This character exists. If you want to create a variant for it, click the button below. (Optional)";
            var createCharacterButton = document.getElementById("popupCreateCardCharacterOrVariantButton");
            createCharacterButton.textContent = "Create Variant";
            var createCharacterPropertiesDiv = document.getElementById("popupCreateCardProperties");
            createCharacterPropertiesDiv.style.visibility = "visible";
        } else {
            var createCharacterDivText = document.getElementById("popupCreateCardCharacterOrVariantText");
            createCharacterDivText.textContent = "This character doesn't exist yet. If you want to create it, click the button below.";
            var createCharacterButton = document.getElementById("popupCreateCardCharacterOrVariantButton");
            createCharacterButton.textContent = "Create Character";
            var createCharacterPropertiesDiv = document.getElementById("popupCreateCardProperties");
            createCharacterPropertiesDiv.style.visibility = "hidden";
        }
    } else {
        var createCharacterDiv = document.getElementById("popupCreateCardCharacterOrVariant");
        createCharacterDiv.style.visibility = "hidden";
        var createCharacterPropertiesDiv = document.getElementById("popupCreateCardProperties");
        createCharacterPropertiesDiv.style.visibility = "hidden";
    }
    // Apply
    applyCreateCard();
}

function changeCreateCardCardType() {
    customCard.cardtype = document.getElementById("popupCreateCardType").value;
    applyCreateCard();
}

function changeCreateCardCost() {
    customCard.cost = document.getElementById("popupCreateCardCost").value;
    applyCreateCard();
}

function changeCreateCardPower() {
    customCard.power = document.getElementById("popupCreateCardPower").value;
    applyCreateCard();
}

function changeCreateCardText() {
    customCard.text = document.getElementById("popupCreateCardText").value;
    applyCreateCard();
}

function addCreateCardEffectTag() {
    var tag = document.getElementById("popupCreateCardEffectTag").value;
    var tagDiv = document.createElement("div");
    tagDiv.textContent = tag;
    tagDiv.classList.add("tagsDiv");

    if (customCard.effectTags.indexOf(tag) == -1) {
        customCard.effectTags.push(tag);
        var deleteButton = document.createElement("button");
        deleteButton.textContent = "X";
        deleteButton.classList.add("tagsDivDelete");
        deleteButton.onclick = function() {
            tagDiv.remove();
            customCard.effectTags.splice(customCard.effectTags.indexOf(tag), 1);
            applyCreateCard();
        };
        tagDiv.appendChild(deleteButton);
    
        document.getElementById("popupCreateCardEffectTags").appendChild(tagDiv);

        applyCreateCard();
    }
}

function applyCreateCard() {
    console.log(customCard);
}
