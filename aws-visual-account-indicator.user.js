// ==UserScript==
// @name         AWS Visual Account Indicator
// @namespace    https://qoomon.github.io
// @version      1.0.10
// @updateURL    https://github.com/qoomon/userscript-aws-visual-account-indicator/raw/main/aws-visual-account-indicator.user.js
// @downloadURL  https://github.com/qoomon/userscript-aws-visual-account-indicator/raw/main/aws-visual-account-indicator.user.js
// @description  This userscript reads the aws-userInfo cookie and adds account name and color indicator
// @author       qoomon
// @match        https://*.console.aws.amazon.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=aws.amazon.com
// @grant        none
// ==/UserScript==

// --- Configure display name and color ------------------------------------

function getDisplayName(userInfo) {
    return userInfo.accountAlias || userInfo.accountName || userInfo.accountId
}

function getDisplayColor(userInfo) {
    const displayName = getDisplayName(userInfo)
    if(displayName.match(/(^|[^a-zA-Z])(production|prod)([^a-zA-Z]|$)/)) return '#921b1d'
    if(displayName.match(/(^|[^a-zA-Z])(staging|stage)([^a-zA-Z]|$)/)) return '#a27401'
    if(displayName.match(/(^|[^a-zA-Z])(sandbox|lab|)([^a-zA-Z]|$)/)) return '#016a83'
    return '#7c7c7c'
}

(function() {
    'use strict';

    const userInfo = getUserInfo()
    const indicatorColor = getDisplayColor(userInfo)

    // --- Add account label ---------------------------------------------------

    const accountNameElement = document.createElement('a')
    if(userInfo.issuer === 'http://signin.aws.amazon.com/signin'){
        accountNameElement.href = 'https://console.aws.amazon.com/console/home'
    } else {
        accountNameElement.href = userInfo.issuer.split('#')[0]
    }
    accountNameElement.innerText = getDisplayName(userInfo)
    accountNameElement.style.cssText = `
        height: 20px;
        color: white !important;
        font-size: 12px;
        line-height: 20px;
        white-space: nowrap;
        background-color: ${indicatorColor};
        border-radius: 48px;
        padding: 0px 10px;
        margin: auto;
        margin-left: 16px;
        margin-right: -4px;
        text-decoration: none;
    `

    const usernameMenuElement = document.querySelector('#nav-usernameMenu')
    usernameMenuElement.parentNode.insertBefore(accountNameElement, usernameMenuElement)

    // --- Add indicator bar ---------------------------------------------------
    const indicatorBarElement = document.createElement('div')

    indicatorBarElement.style.cssText = `
      height: 8px;
      background: repeating-linear-gradient(-45deg, ${indicatorColor}, ${indicatorColor} 12px, transparent 0px, transparent 24px);
      margin-top: 4px;
    `

    const navHeaderElement = document.querySelector('#awsc-nav-header nav')
    navHeaderElement.appendChild(indicatorBarElement)
})();

// --- Utils ---------------------------------------------------------------

function getCookie(name) {
    return document.cookie.split('; ').find(c => c.startsWith(`${name}=`))
        .replace(/^[^=]+=/, '')
}

function getUserInfo() {
    const userInfo = JSON.parse(decodeURIComponent(getCookie('aws-userInfo')))

    let identityArn = userInfo.arn
    let identityDisplayName = decodeURIComponent(userInfo.username).replace(/^[^/]*\//, '')
    if (identityDisplayName.startsWith('AWSReservedSSO_')) {
        identityDisplayName = identityDisplayName.replace(/^AWSReservedSSO_/, '').replace(/_[^_]+\//, '/')
    }
    let accountId = userInfo.arn.split(':')[4]
    let accountAlias = userInfo.alias !== accountId ? userInfo.alias : undefined
    let issuer = decodeURI(userInfo.issuer)
    let issuerMatch = issuer.match(new RegExp(`/${accountId} \\((?<name>[^)]*)\\)/`))
    let accountName = issuerMatch ? issuerMatch.groups.name : undefined

    return {
        identityArn,
        identityDisplayName,
        accountId,
        accountAlias,
        issuer,
        accountName,
    }
}
