// In renderer process (web page).
const { ipcRenderer } = require("electron");

class MainGUI {
  constructor() {
    this.appState = "account";
  }

  changeAppState(newState) {
    this.appState = newState;
    $(".sidebarIconWrapper").removeClass("iconSelected");

    switch (this.appState) {
      case "account":
        $("#mainNavBtnWalletsWrapper").addClass("iconSelected");
        break;
      case "addressBook":
        $("#mainNavBtnAddressBoookWrapper").addClass("iconSelected");
        break;
      case "send":
        $("#mainNavBtnSendWrapper").addClass("iconSelected");
        break;
      case "transactions":
        $("#mainNavBtnTransactionsWrapper").addClass("iconSelected");
        break;
      case "settings":
        $("#mainNavBtnSettingsWrapper").addClass("iconSelected");
        break;
      default: // do nothing for now
    }
  }

  getAppState() {
    return this.appState;
  }

  showGeneralError(errorText) {
    $("#txtGeneralError").html(errorText);

    // create and open the dialog
    $("#dlgGeneralError").iziModal();
    $("#dlgGeneralError").iziModal("open");

    $("#btnGeneralErrorOK").click(function () {
      $("#dlgGeneralError").iziModal("close");
    });
  }

  showGeneralConfirmation(confirmText, callback) {
    $("#txtGeneralConfirm").html(confirmText);

    // create and open the dialog
    $("#dlgGeneralConfirm").iziModal();
    $("#dlgGeneralConfirm").iziModal("open");

    $("#btnGeneralConfirmYes").click(function () {
      $("#dlgGeneralConfirm").iziModal("close");
      callback(true);
    });

    $("#btnGeneralConfirmNo").click(function () {
      $("#dlgGeneralConfirm").iziModal("close");
      callback(false);
    });
  }

  showAboutDialog(infoData) {
    $("#versionNumber").html(infoData.version);

    // create and open the dialog
    $("#dlgAboutInfo").iziModal();
    $("#dlgAboutInfo").iziModal("open");

    $("#urlOpenLicence, #urlOpenGitHub")
      .off("click")
      .on("click", function (event) {
        event.preventDefault();
        ipcRenderer.send("openURL", $(this).attr("href"));
      });

    $("#btnAboutInfoClose")
      .off("click")
      .on("click", function (event) {
        $("#dlgAboutInfo").iziModal("close");
      });
  }

  renderTemplate(template, data, container) {
    var template = Handlebars.compile(
      ipcRenderer.sendSync("getTemplateContent", template)
    );

    if (!container) {
      container = $("#mainContent");
    }

    container.empty();
    container.html(template(data));
  }

  copyToClipboard(text) {
    var $temp = $("<input>");
    $("body").append($temp);
    $temp.val(text).select();
    document.execCommand("copy");
    $temp.remove();
  }
}

ipcRenderer.on("showAboutDialog", function (event, message) {
  DUBXMainGUI.showAboutDialog(message);
});

$("#mainNavBtnTransactions").click(function () {
  DUBXTransactions.clearFilter();
  DUBXMainGUI.changeAppState("transactions");
  DUBXTransactions.renderTransactions();
});

$("#mainNavBtnAddressBoook").click(function () {
  DUBXMainGUI.changeAppState("addressBook");
  DUBXAddressBook.renderAddressBook();
});

$("#mainNavBtnSend").click(function () {
  DUBXMainGUI.changeAppState("send");
  DUBXSend.renderSendState();
});

$("#mainNavBtnWallets").click(function () {
  DUBXMainGUI.changeAppState("account");
  DUBXWallets.renderWalletsState();
});

$("#mainNavBtnSettings").click(function () {
  DUBXMainGUI.changeAppState("settings");
  DUBXSettings.renderSettingsState();
});

DUBXMainGUI = new MainGUI();
