var officialCards;
var customCards;

var req = new XMLHttpRequest();
req.open('GET', '/cards', true);
req.onreadystatechange = function() {
    if (req.readyState == 4 && req.status == 200) {
        var data = JSON.parse(req.responseText);
        officialCards = data.officialCards;
        customCards = data.customCards;
        applyFilters();
    }
};
req.send();


// Filtersystem

var filters = {
    search: "",
    cardType: "All",
    sources: "All",
    effectTags: [],
    characterTags: [],
    order: "Name",
    orderAscend: false
};

var filterRunning = false;

function changeSearch() {
    filters.search = document.getElementById("search").value;
    
    applyFilters();
}

function changeCardType() {
    filters.cardType = document.getElementById("cardTypeSelect").value;

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
        cardType: "All",
        sources: "All",
        effectTags: [],
        characterTags: [],
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
        || card.description.toLowerCase().includes(filters.search.toLowerCase()))
        && (filters.cardType == "All" || card.type == filters.cardType)
        && (filters.sources == "All" || (filters.sources == "custom" && card.custom) || (filters.sources == "official" && !card.custom))
        && (filters.effectTags.length == 0 || filters.effectTags.every(tag => card.effectTags.includes(tag)))
        && (filters.characterTags.length == 0 || filters.characterTags.every(tag => card.characterTags.includes(tag)));
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
        document.getElementById("popupDesc-charactertags").innerHTML = "";
        if (card.characterTags != null && card.characterTags.length > 0) {
            for (var j = 0; j < card.characterTags.length; j++) {
                var tag = document.createElement("div");
                tag.textContent = card.characterTags[j];
                tag.classList.add("tagsDiv");
                document.getElementById("popupDesc-charactertags").appendChild(tag);
            }
        } else {
            var tag = document.createElement("div");
            tag.textContent = "None";
            tag.classList.add("tagsDiv");
            document.getElementById("popupDesc-charactertags").appendChild(tag);
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

function closeCreateCustomCardPopup() {
    document.getElementById("createCustomCardPopup").style.visibility = "hidden";
}

function openCreateCustomCardPopup() {
    document.getElementById("createCustomCardPopup").style.visibility = "visible";
}

// Create Custom Card

