const STATS = ["hp", "atk", "def", "satk", "sdef", "spd"];
let allPokemon = {};
let currentPokemon = "";

function initEVs(pokemon) {
    for (const stat of STATS) {
        const key = `${pokemon}-${stat}`;
        if (localStorage.getItem(key) === null) {
            localStorage.setItem(key, "0");
        }
    }
}

function setupStatListeners() {
    for (const stat of STATS) {
        document.getElementById(stat).addEventListener("input", () => {
            if (!currentPokemon) return;
            let val = parseInt(document.getElementById(stat).value) || 0;
            val = Math.min(val, 252);
            val = Math.max(val, 0);
            const total = getTotal() - (parseInt(localStorage.getItem(`${currentPokemon}-${stat}`)) || 0) + val;
            if (total > 510) {
                val -= (total - 510);
            }
            document.getElementById(stat).value = val;
            localStorage.setItem(`${currentPokemon}-${stat}`, val);
            drawTotal();
        });
    }
}

function initPokemon() {
    const stored = localStorage.getItem("pokemon");
    if (stored === null) {
        localStorage.setItem("pokemon", JSON.stringify({}));
    } else {
        allPokemon = JSON.parse(stored);
    }

    document.getElementById("add-pokemon").addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            addPokemonFromInput();
        }
    });

    document.getElementById("add-pokemon-btn").addEventListener("click", () => {
        addPokemonFromInput();
    });
}

function addPokemonFromInput() {
    const input = document.getElementById("add-pokemon");
    const name = input.value.trim();
    if (!name) return;
    createPokemon(name);
    input.value = "";
}

function createPokemon(name) {
    allPokemon[name] = {
        hp: 0,
        atk: 0,
        def: 0,
        satk: 0,
        sdef: 0,
        spd: 0
    };

    localStorage.setItem("pokemon", JSON.stringify(allPokemon));
    initEVs(name);
    selectPokemon(name);
    renderPokemonList();
}

function selectPokemon(name) {
    currentPokemon = name;
    draw();
    renderPokemonList();
}

function deletePokemon(name) {
    for (const stat of STATS) {
        localStorage.removeItem(`${name}-${stat}`);
    }
    delete allPokemon[name];
    localStorage.setItem("pokemon", JSON.stringify(allPokemon));

    const names = Object.keys(allPokemon);
    if (currentPokemon === name) {
        if (names.length > 0) {
            selectPokemon(names[0]);
        } else {
            currentPokemon = "";
            draw();
        }
    }
    renderPokemonList();
}

function renderPokemonList() {
    const container = document.getElementById("pokemon-list");
    container.innerHTML = "";

    for (const name of Object.keys(allPokemon)) {
        const wrapper = document.createElement("div");
        wrapper.className = "pokemon-tab-wrapper";

        const btn = document.createElement("button");
        btn.textContent = name;
        btn.className = "pokemon-tab" + (name === currentPokemon ? " active" : "");
        btn.addEventListener("click", () => selectPokemon(name));

        const del = document.createElement("button");
        del.textContent = "X";
        del.className = "pokemon-delete";
        del.addEventListener("click", (e) => {
            e.stopPropagation();
            deletePokemon(name);
        });

        wrapper.appendChild(btn);
        wrapper.appendChild(del);
        container.appendChild(wrapper);
    }
}

function getTotal() {
    let total = 0;
    for (const stat of STATS) {
        total += parseInt(localStorage.getItem(`${currentPokemon}-${stat}`)) || 0;
    }
    return total;
}

function drawTotal() {
    document.getElementById("total").innerText = `Total EVS: ${getTotal()}/510`;
}

function draw() {
    if (!currentPokemon) {
        for (const stat of STATS) {
            document.getElementById(stat).value = "";
        }
        document.getElementById("total").innerText = "";
        return;
    }

    let total = 0;
    for (const stat of STATS) {
        const val = parseInt(localStorage.getItem(`${currentPokemon}-${stat}`)) || 0;
        document.getElementById(stat).value = val;
        total += val;
    }

    document.getElementById("total").innerText = `Total EVS: ${total}/510`;
}

function add(prop, qty) {
    if (!currentPokemon) return;
    const key = `${currentPokemon}-${prop}`;
    const val = parseInt(localStorage.getItem(key)) || 0;
    const total = getTotal();
    let newVal = val + qty;
    newVal = Math.min(newVal, 252);
    if (total - val + newVal > 510) {
        newVal = 510 - (total - val);
    }
    if (newVal < 0) newVal = 0;
    localStorage.setItem(key, newVal);
    draw();
}

function encodeExportInt(pokemon) {
    let stats = {
        hp: parseInt(localStorage.getItem(`${pokemon}-hp`)),
        atk: parseInt(localStorage.getItem(`${pokemon}-atk`)),
        def: parseInt(localStorage.getItem(`${pokemon}-def`)),
        satk: parseInt(localStorage.getItem(`${pokemon}-satk`)),
        sdef: parseInt(localStorage.getItem(`${pokemon}-sdef`)),
        spd: parseInt(localStorage.getItem(`${pokemon}-spd`))
    };

    result = "";

    for (stat of Object.values(stats)) {
        let binary = stat.toString(2);
        while (binary.length < 8) {
            binary = "0" + binary;
        }
        result += binary;
    }

    alert(parseInt(result, 2));
}

function decodeExportInt(pokemon, number) {
    let binary = number.toString(2);
    // Pad to 48 bits (6 stats × 8 bits)
    while (binary.length < 48) {
        binary = "0" + binary;
    }

    for (let i = 0; i < STATS.length; i++) {
        const chunk = binary.substring(i * 8, (i + 1) * 8);
        const val = parseInt(chunk, 2);
        localStorage.setItem(`${pokemon}-${STATS[i]}`, val);
    }

    draw();
}

function init() {
    initPokemon();
    setupStatListeners();

    document.getElementById("export").addEventListener("click", () => {
        if (!currentPokemon) return;
        encodeExportInt(currentPokemon);
    });

    document.getElementById("import-btn").addEventListener("click", () => {
        if (!currentPokemon) return;
        const code = parseInt(document.getElementById("import-code").value);
        if (isNaN(code)) return;
        decodeExportInt(currentPokemon, code);
    });

    // Restore saved pokemon on load
    const names = Object.keys(allPokemon);
    for (const name of names) {
        initEVs(name);
    }

    if (names.length > 0) {
        selectPokemon(names[0]);
    } else {
        draw();
    }

    renderPokemonList();
}

init();
