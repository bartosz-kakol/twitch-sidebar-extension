browser.browserAction.onClicked.addListener(() => {
    browser.sidebarAction.toggle();
});

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "startOAuth") {
        const redirectUri = browser.identity.getRedirectURL();
        const clientId = "yax8vhli0i2xalqp3tg51e7i5l1t7o";
        const authUrl = `https://id.twitch.tv/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=token&scope=user:read:follows`;

        browser.identity.launchWebAuthFlow({
            interactive: true,
            url: authUrl
        }).then((redirectedTo) => {
            console.log(redirectedTo);
            const params = new URLSearchParams(new URL(redirectedTo.replace("#", "?")).search);

            if (params.has("error")) {
                sendResponse({
                    success: false,
                    error: {
                        name: params.get("error"),
                        description: params.get("error_description")
                    }
                });
            } else {
                const token = params.get("access_token");
                browser.storage.local.set({ token });
                sendResponse({ success: true });
            }
        });

        return true;
    }
});
  