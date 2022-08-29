// ==UserScript==
// @name         AWS Visual Account Indicator
// @namespace    https://qoomon.github.io
// @version      1.0.0
// @updateURL    https://github.com/qoomon/userscript-aws-visual-account-indicator/raw/main/aws-visual-account-indicator.user.js
// @downloadURL  https://github.com/qoomon/userscript-aws-visual-account-indicator/raw/main/aws-visual-account-indicator.user.js
// @description  This script reads login cookie and adds account name and color indicator
// @author       qoomon
// @match        https://*.console.aws.amazon.com/*
// @icon         https://a0.awsstatic.com/libra-css/images/logos/aws_smile-header-desktop-en-white_59x35.png
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // --- Configure display name and color ------------------------------------

    function getAccountDisplayName(userInfo) {
        return userInfo.accountName || userInfo.accountAlias || userInfo.accountId
    }

    function getAccountDisplayColor(userInfo) {
        const displayName = getAccountDisplayName(userInfo)
        if(displayName.includes('prod-')) return '#bf1212'
        if(displayName.includes('stage-')) return '#b78403'
        if(displayName.includes('lab-')) return '#007c9a'
        return '#b8b8b891'
    }

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

    const userInfo = getUserInfo()
    const indicatorColor = getAccountDisplayColor(userInfo)

    // --- Add account label ---------------------------------------------------

    const accountNameElement = document.createElement('span')
    accountNameElement.innerText = getAccountDisplayName(userInfo)
    accountNameElement.style.cssText = `
        color: white !important;
        background-color: ${indicatorColor};
        white-space: nowrap;
        padding: 0px 8px;
        margin-right: 8px;
        border-radius: 48px;
    `

    const usernameMenuElement = document.querySelector('#nav-usernameMenu')
    usernameMenuElement.insertBefore(accountNameElement, usernameMenuElement.firstChild)

    // --- Add indicator bar ---------------------------------------------------
    const indicatorBarElement = document.createElement('div')

    indicatorBarElement.style.cssText = `
      background: repeating-linear-gradient(-45deg, ${indicatorColor}, ${indicatorColor} 12px, transparent 0px, transparent 24px);
      height: 8px;
      margin-top: 4px;
    `

    const navHeaderElement = document.querySelector('#awsc-nav-header nav')
    navHeaderElement.appendChild(indicatorBarElement)
})();
