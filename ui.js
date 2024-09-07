const errorNameDisplay = document.getElementById("error-name");
const errorDescriptionDisplay = document.getElementById("error-desc");
const profilePictureDisplay = document.querySelector("#profile-box > img");
const profileNameDisplay = document.querySelector("#profile-box > div > label");
const userIdDisplay = document.querySelector("#profile-box > div > p");
const channelList = document.getElementById("channels-list");

const CLIENT_ID = "yax8vhli0i2xalqp3tg51e7i5l1t7o";

/** @type {?string} */
let token = null;
/** @type {?string} */
let user = null;

function switchPanel(panelId) {
    const visiblePanel = document.querySelector(".panel.visible");

    if (visiblePanel) {
        visiblePanel.classList.remove("visible");
    }

    document.getElementById(panelId).classList.add("visible");
}

function checkToken() {
    browser.storage.local.get("token").then(result => {
        if ("token" in result) {
            token = result.token;
            
            fetchAndRememberUser(() => {
                switchPanel("panel-channels");

                profilePictureDisplay.src = user.profile_image_url;
                profileNameDisplay.innerText = user.display_name;
                userIdDisplay.innerText = `ID: ${user.id}`;

                refreshChannels();
            });
        } else {
            switchPanel("panel-login");
        }
    });
}

function fetchAndRememberUser(cb) {
    browser.storage.local.get("user").then(result => {
        if ("user" in result) {
            user = result.user;
            cb();
        } else {
            fetch("https://api.twitch.tv/helix/users", {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Client-ID": CLIENT_ID
                }
            })
                .then(r => r.json())
                .then(data => {
                    if (data.data && data.data.length > 0) {
                        user = data.data[0];
                        cb();
                    } else {
                        errorNameDisplay.innerText = "Nie udało się pobrać Twojego identyfikatora.";
                        errorDescriptionDisplay.innerText = "Spróbuj ponownie później.";
                        switchPanel("panel-error");
                    }
                })
                .catch(err => {
                    errorNameDisplay.innerText = "Nie udało się pobrać Twojego identyfikatora.";
                    errorDescriptionDisplay.innerText = err?.message ?? "Spróbuj ponownie później.";
                    switchPanel("panel-error");
                });
        }
    });
}

async function refreshChannels() {
    const response = await fetch(`https://api.twitch.tv/helix/streams/followed?user_id=${user.id}&first=100`, {
        headers: {
            "Authorization": `Bearer ${token}`,
            "Client-Id": CLIENT_ID
        }
    });
    const data = (await response.json()).data;

    const items = data.map(stream => {
        const el = document.createElement("div");
        el.classList.add("channel");
        el.title = stream.title;
        el.addEventListener("click", (event) => {
            if (event.button !== 0) return;
            
            browser.tabs.create({ url: `https://www.twitch.tv/${stream.user_login}` });
            browser.sidebarAction.close();
        });

        const pfp = document.createElement("img");
        pfp.id = `pfp:${stream.user_id}`
        pfp.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAACXBIWXMAAAsTAAALEwEAmpwYAAAESUlEQVRoBe1YOUs0SxQ9477vKIqg4I6JgQuYqKCYiGCggmBk4PojXmxsooGRoJGIgZiIGrmAKIoooqK4objvu+87BdV09zczdnXrewzMhaGr6p6qurfq1l3G1dvb+wUfpgAfll2I7lfg/75B/w34b8DhCfhNyOEBOp4e5HgF0wI3NzdYX1/H/v4+rq+vBTcuLg4ZGRkoLCxEbGysaYazruunIvHj4yMmJyexuLiIz89Pt1IFBgaitLQUtbW1iIiIcItRHfyRGzg9PcXg4CCurq687v/x8YG5uTlsbm6ira0NycnJXvFWmI4f8eXlJQYGBv4SPiAgQJwyT5ptPVHR/v7+v+boMVbbjm7g6+sLIyMjuLu70/YLCQlBRUUFysrKEB0dLcZvb2+Fac3OzuL19VWMcc7w8DA6Ozvhcrm0+aoN49Eozl5dXcXe3p42KzIyEl1dXaipqUFMTIwQjMLx4XKsu7sbxEji3LW1Ndm19XWkwMLCgmHTpqYmpKWlGcb0ndTUVDQ2NuqHMD8/b+irdmwrQFPY3d3V9ktPT0dBQYHW99QgRq8k3e3b25sn+LfjthXgQ9S7y5ycnG83I4AmlZeXp2EpPGOHXbKtwMvLi2HPqKgoQ99bx4x9enryBvfKs61AWFiYYWF6GqtkxjoJarYViI+PByOrJAYnutXviJiNjQ0NRrfrJL2wrUBwcDByc3M1QRiNl5eXtb6nBjFnZ2caOysrC0FB9sORbQUoQXl5uSYIG6Ojo9je3jaM6TvkEaMn8xp6npV24J8A848VoDtMUlISDg4OcH5+LtjMdXjCjLIMZAxaNJnj42NMTU1hfHwcxEjKz88XAU727XwdZ6P39/fo6+sDcyIVSkhIQE9PD8weSWUNYh2ZEBegAO3t7WCUtUoMZB0dHY6F536OTEgKHB4ejpKSEhGkTk5O8P7+LlmGL3GVlZVobm7+sXrAsQkZJPzTYYpBe5+enjawqqqqUF1dDXqvnyTHJmQWhm+CWaqZmHWS99Nk+wZYQu7s7Ig8RgYw+veVlRWY0wwpdGhoKIqKirRKTKba2dnZoHnZIeUIQmFnZmaEmcjixNPGjLIkiaNi5hScfOJoXiyEVIsbZQXGxsZEXcuNvRFjQGtrq4gDQ0NDeHh48AinghMTE6LEbGho8Ihzx1DyQltbWyIYuVtIjtGtspxsaWlBSkoK6O+Li4tFAGOskLch8frv4eEhMjMzkZiYqB/22la6AXP1RMHoPpnU8eopPBMzcxHP8fr6etTV1Yk3w8dMU2RU5t8wS0tLmpD818JqbcFJSgowbZDENILloYrNUjFmsfxJ4h9erI0vLi7E0NHRkWRZ+iq5UX3hIYt2S7t4AVEpriXp+flZNi19lRSwtOJ/DPJ5BZTeAO1V5jkqydt3l6Jfi8FOhWxHYpVNfhPr8ybkV+A3zcPK2v4bsHJKv4nx38Bvnq6VtX3+Bv4FrueKJereCTAAAAAASUVORK5CYII=";

        const name = document.createElement("label");
        name.classList.add("name");
        name.innerText = stream.user_name;

        const topic = document.createElement("label");
        topic.classList.add("topic");
        topic.innerText = stream.game_name;

        const watching = document.createElement("label");
        watching.classList.add("watching");
        watching.innerText = stream.viewer_count;

        el.append(pfp, name, topic, watching);

        return el;
    });

    channelList.innerHTML = "";
    channelList.append(...items);

    const idParams = data.map(stream => `id=${stream.user_id}`).join("&");
    const streamersResponse = await fetch(`https://api.twitch.tv/helix/users?${idParams}`, {
        headers: {
            "Authorization": `Bearer ${token}`,
            "Client-Id": CLIENT_ID
        }
    });
    const streamersData = (await streamersResponse.json()).data;

    for (const streamer of streamersData) {
        const pfpEl = document.getElementById(`pfp:${streamer.id}`);

        if (!pfpEl) continue;

        pfpEl.src = streamer.profile_image_url;
    }
}

document.getElementById("login-btn").addEventListener("click", () => {
    switchPanel("panel-login-progress");
    browser.runtime.sendMessage({ action: "startOAuth" }).then(response => {
        if (response.success) {
            checkToken();
        } else {
            errorNameDisplay.innerText = response.error.name;
            errorDescriptionDisplay.innerText = response.error.description;
            switchPanel("panel-error");
        }
    });
});

document.getElementById("start-again-btn").addEventListener("click", () => {
    switchPanel("panel-login");
});

document.getElementById("logout-btn").addEventListener("click", () => {
    const sure = confirm("Na pewno chcesz się wylogować?");

    if (sure) {
        browser.storage.local.clear().then(() => {
            switchPanel("panel-login");
        });
    }
});

checkToken();
