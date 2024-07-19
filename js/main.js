async function getCards() {
    try {
        const response = await fetch("/cards");
        const data = await response.json();
        return data;
    } catch (error) {
        console.log(error);
    }
}

async function getLocations() {
    try {
        const response = await fetch("/locations");
        const data = await response.json();
        return data;
    } catch (error) {
        console.log(error);
    }
}

var officialCards;
var officialLocations;

getCards().then(data => {
    officialCards = data;
    // Flter out unreleased cards
    officialCards = officialCards.filter(card => card.status != "unreleased");
    addAllTags();
});

getLocations().then(data => {
    officialLocations = data;
});

var customCards;

// tags

var tags = [];

function addAllTags() {
    for (var key in officialCards) {
        var card = officialCards[key];
        if (card.tags != null) {
            for (var i = 0; i < card.tags.length; i++) {
                tags.push(card.tags[i]);
            }
        }
    }
    // Sort {tag_id, tag, tag_slug} by tag_id
    tags.sort((a, b) => a.tag_id - b.tag_id);
    // Remove duplicates
    tags = tags.filter((tag, index) => tags.findIndex(t => t.tag_id == tag.tag_id) == index);
    var tagsSelect = document.getElementById("tag");
    tagsSelect.innerHTML = "";
    for (var i = 0; i < tags.length; i++) {
        var option = document.createElement("option");
        option.value = tags[i].tag_slug;
        option.textContent = tags[i].tag;
        tagsSelect.appendChild(option);
    }
    applyFilters()
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
    tags: [],
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
    document.getElementById("tags").innerHTML = "";
    document.getElementById("order").value = "Name";
    filters = {
        search: "",
        cardtype: "All",
        sources: "All",
        tags: [],
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

function addTagFilter() {
    var tag = document.getElementById("tag").value;
    var tagDiv = document.createElement("div");
    tagDiv.textContent = document.getElementById("tag").textContent;
    tagDiv.classList.add("tagsDiv");

    if (filters.tags.indexOf(tag) == -1) {
        filters.tags.push(tag);
        var deleteButton = document.createElement("button");
        deleteButton.textContent = "X";
        deleteButton.classList.add("tagsDivDelete");
        deleteButton.onclick = function() {
            tagDiv.remove();
            filters.tags.splice(filters.tags.indexOf(tag), 1);
            applyFilters();
        };
        tagDiv.appendChild(deleteButton);
    
        document.getElementById("tags").appendChild(tagDiv);

        console.log(filters.tags);
        applyFilters();
    }
}

async function applyFilters() {
    if (filterRunning) {
        return;
    }
    filterRunning = true;

    var cards = [];
    for (var i = 0; i < officialCards.length; i++) {
        var card = officialCards[i];
        card.custom = false;
        if (card.source == "Not Available" || card.source == "None") {
            card.type = "Token";
        }
        card.ability = card.ability.replace(/<span>/g, "").replace(/<\/span>/g, "");
        cards.push(card);
        var variants = [];
        for (var j = 0; j < card.variants.length; j++) {
            if (card.variants[j] == null) {
                continue;
            }
            variants.push(card.variants[j].art);
        }
        card.variants = variants;
    }

    var filteredCards = cards.filter(function(card) {
        return (card.name.toLowerCase().includes(filters.search.toLowerCase())
        || card.ability.toLowerCase().includes(filters.search.toLowerCase())
        || card.flavor.toLowerCase().includes(filters.search.toLowerCase()))
        && (filters.cardtype == "All" || card.type == filters.cardtype)
        && (filters.sources == "All" || (filters.sources == "custom" && card.custom) || (filters.sources == "official" && !card.custom))
        && (filters.tags.length == 0 || (card.tags && card.tags.every(tag => filters.tags.includes(tag.tag_slug))));
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
        var variantSeleted = -1;
        document.getElementById("popupImgDiv").innerHTML = "";
        var img = await generateCharcterImage(card, 500, variantSeleted);
        document.getElementById("popupImgDiv").appendChild(img);
        document.getElementById("popupImgDiv").onclick = async function() {
            var oldVS = variantSeleted;
            variantSeleted++;
            if (card.variants == null || card.variants.length == 0) {
                variantSeleted = -1;
            } else if (variantSeleted >= card.variants.length) {
                variantSeleted = -1;
            }
            if (oldVS != variantSeleted) {
                var img = await generateCharcterImage(card, 500, variantSeleted);
                document.getElementById("popupImgDiv").innerHTML = "";
                document.getElementById("popupImgDiv").appendChild(img);
            }
        };

        if (card.custom) {
            var downloadButton = document.createElement("button");
            downloadButton.setAttribute("data-character", JSON.stringify(card));
            downloadButton.textContent = "Download Image";
            downloadButton.classList.add("popupDownloadImgBtn");
            downloadButton.onclick = function() {
                var link = document.createElement("a");
                link.setAttribute("download", card.id + ".png");
                link.setAttribute("href", document.getElementById("popupImgDiv").getElementsByTagName("canvas")[0].toDataURL("image/png").replace("image/png", "image/octet-stream"));
                link.click();
            };
            document.getElementById("popupImgDiv").appendChild(downloadButton);
        }
        document.getElementById("popupDesc-cardtype").textContent = card.type;
        document.getElementById("popupDesc-cost&power").textContent = "Cost: " + card.cost + " Power: " + card.power;
        if (card.ability != null && card.ability != "") {
            document.getElementById("popupDesc-text").textContent = card.ability;
        } else {
            document.getElementById("popupDesc-text").textContent = card.flavor;
        }
        document.getElementById("popupDesc-tags").innerHTML = "";
        if (card.tags != null && card.tags.length > 0) {
            for (var j = 0; j < card.tags.length; j++) {
                var tag = document.createElement("div");
                tag.textContent = card.tags[j].tag;
                tag.classList.add("tagsDiv");
                document.getElementById("popupDesc-tags").appendChild(tag);
            }
        } else {
            var tag = document.createElement("div");
            tag.textContent = "None";
            tag.classList.add("tagsDiv");
            document.getElementById("popupDesc-tags").appendChild(tag);
        }
        if (card.custom) {
            document.getElementById("popupDesc-source").textContent = "Custom";
        } else {
            document.getElementById("popupDesc-source").textContent = "Marvel Snap";
        }
        document.getElementById("popupDesc-source").onclick = function() {
            window.open(card.url, "_blank");
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
    if (card.ability != null && card.ability != "") {
        cardTextDiv.textContent = card.ability;
    } else {
        cardTextDiv.textContent = card.flavor;
    }
    cardDiv.appendChild(cardTextDiv);
    // Complete
    characterListDiv.appendChild(cardDiv);
}

async function generateCharcterImage(character, size, variantSelected = -1) {
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
        if (variantSelected == -1) {
            img.src = character.art;
        } else {
            img.src = character.variants[variantSelected];
        }
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
    // Tags
    var tagsSelect = document.getElementById("popupCreateCardTag");
    tagsSelect.innerHTML = "";
    for (var i = 0; i < tags.length; i++) {
        var option = document.createElement("option");
        option.value = tags[i];
        option.textContent = tags[i];
        tagsSelect.appendChild(option);
    }
    // Reset Custom Card
    customCard = {
        name: "",
        id: "",
        cardtype: "Card",
        cost: 0,
        power: 0,
        text: "",
        tags: [],
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
    tags: [],
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

function addCreateCardTag() {
    var tag = document.getElementById("popupCreateCardTag").value;
    var tagDiv = document.createElement("div");
    tagDiv.textContent = tag;
    tagDiv.classList.add("tagsDiv");

    if (customCard.tags.indexOf(tag) == -1) {
        customCard.tags.push(tag);
        var deleteButton = document.createElement("button");
        deleteButton.textContent = "X";
        deleteButton.classList.add("tagsDivDelete");
        deleteButton.onclick = function() {
            tagDiv.remove();
            customCard.tags.splice(customCard.tags.indexOf(tag), 1);
            applyCreateCard();
        };
        tagDiv.appendChild(deleteButton);
    
        document.getElementById("popupCreateCardTags").appendChild(tagDiv);

        applyCreateCard();
    }
}

function applyCreateCard() {
    console.log(customCard);
}
