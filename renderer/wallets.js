const {ipcRenderer} = require('electron');

class Wallets {
  constructor() {
    this.addressList = [];
    this.price = null;

    $.getJSON("https://api.coingecko.com/api/v3/simple/price?ids=teslafunds&vs_currencies=usd", function( price )
    {
      DUBXWallets._setPrice(price['teslafunds'].usd);
    });
  }

  _getPrice() {
    return this.price;
  }

  _setPrice(price) {
    this.price = price;
  }

  getAddressList() {
    return this.addressList;
  }

  clearAddressList() {
    this.addressList = [];
  }

  getAddressExists(address) {
    if (address) {
      return this.addressList.indexOf(address.toLowerCase()) > -1;
    } else {
      return false;
    }
  }

  addAddressToList(address) {
    if (address) {
      this.addressList.push(address.toLowerCase());
    }
  }

  enableButtonTooltips() {
    DUBXUtils.createToolTip("#btnNewAddress", "Create New Address");
    DUBXUtils.createToolTip("#btnRefreshAddress", "Refresh Address List");
    DUBXUtils.createToolTip("#btnExportAccounts", "Export Accounts");
    DUBXUtils.createToolTip("#btnImportAccounts", "Import Accounts");
    DUBXUtils.createToolTip("#btnImportFromPrivateKey", "Import From Private Key");
  }

  validateNewAccountForm() {
    if (DUBXMainGUI.getAppState() == "account") {
        if (!$("#walletPasswordFirst").val()) {
            DUBXMainGUI.showGeneralError("Password cannot be empty!");
            return false;
        }

        if (!$("#walletPasswordSecond").val()) {
          DUBXMainGUI.showGeneralError("Password cannot be empty!");
          return false;
        }

        if ($("#walletPasswordFirst").val() !== $("#walletPasswordSecond").val()) {
            DUBXMainGUI.showGeneralError("Passwords do not match!");
            return false;
        }

        return true;
    } else {
        return false;
    }
}

validateImportFromKeyForm() {
    if (DUBXMainGUI.getAppState() == "account") {
      if (!$("#inputPrivateKey").val()) {
        DUBXMainGUI.showGeneralError("Private key cannot be empty!");
        return false;
      }

      if (!$("#keyPasswordFirst").val()) {
        DUBXMainGUI.showGeneralError("Password cannot be empty!");
        return false;
      }

      if (!$("#keyPasswordSecond").val()) {
        DUBXMainGUI.showGeneralError("Password cannot be empty!");
        return false;
      }

      if ($("#keyPasswordFirst").val() !== $("#keyPasswordSecond").val()) {
        DUBXMainGUI.showGeneralError("Passwords do not match!");
        return false;
      }

      return true;
    } else {
      return false;
    }
  }


renderWalletsState() {
    // clear the list of addresses
    DUBXWallets.clearAddressList();

    DUBXBlockchain.getAccountsData(
      function(error) {
        DUBXMainGUI.showGeneralError(error);
      },
      function(data) {
        data.addressData.forEach(element => {
          DUBXWallets.addAddressToList(element.address);
        });

        // render the wallets current state
        DUBXMainGUI.renderTemplate("wallets.html", data);
        $(document).trigger("render_wallets");
        DUBXWallets.enableButtonTooltips();

        $("#labelSumDollars").html(vsprintf("/ %.2f $ &nbsp;&nbsp;&nbsp;&nbsp;Price DUBX/USD %.4f $", [data.sumBalance * DUBXWallets._getPrice(), DUBXWallets._getPrice()]));
      }
    );
  }
}

// the event to tell us that the wallets are rendered
$(document).on("render_wallets", function() {
   if ($("#addressTable").length > 0) {
    new Tablesort(document.getElementById("addressTable"));
    $("#addressTable").floatThead();
  }

  $("#btnNewAddress").off('click').on('click', function() {
    $("#dlgCreateWalletPassword").iziModal();
    $("#walletPasswordFirst").val("");
    $("#walletPasswordSecond").val("");
    $('#dlgCreateWalletPassword').iziModal('open');

    function doCreateNewWallet() {
      $('#dlgCreateWalletPassword').iziModal('close');

      if (DUBXWallets.validateNewAccountForm()) {
        DUBXBlockchain.createNewAccount($("#walletPasswordFirst").val(),
          function(error) {
            DUBXMainGUI.showGeneralError(error);
          },
          function(account) {
            DUBXWallets.addAddressToList(account);
            DUBXWallets.renderWalletsState();

            iziToast.success({
              title: 'Created',
              message: 'New wallet was successfully created',
              position: 'topRight',
              timeout: 5000
            });
          }
        );
      }
    }

    $("#btnCreateWalletConfirm").off('click').on('click', function() {
      doCreateNewWallet();
    });

    $("#dlgCreateWalletPassword").off('keypress').on('keypress', function(e) {
      if(e.which == 13) {
        doCreateNewWallet();
      }
    });
  });

  $(".btnShowAddressTransactions").off('click').on('click', function() {
    DUBXTransactions.setFilter($(this).attr('data-wallet'));
    DUBXMainGUI.changeAppState("transactions");
    DUBXTransactions.renderTransactions();
  });

  $(".btnShowQRCode").off("click").on("click", function () {
    var QRCodeAddress = $(this).attr("data-address");
    $("#dlgShowAddressQRCode").iziModal();
    $("#addrQRCode").html("");
    $("#addrQRCode").qrcode(QRCodeAddress);
    $("#dlgShowAddressQRCode").iziModal("open");

    $("#btnScanQRCodeClose").off("click").on("click", function () {
      $("#dlgShowAddressQRCode").iziModal("close");
    });
  });

  $(".btnChangWalletName").off('click').on('click', function() {
    var walletAddress = $(this).attr('data-wallet');
    var walletName = $(this).attr('data-name');

    $("#dlgChangeWalletName").iziModal();
    $("#inputWalletName").val(walletName);
    $('#dlgChangeWalletName').iziModal('open');

    function doChangeWalletName() {
      var wallets = DUBXDatatabse.getWallets();

      // set the wallet name from the dialog box
      wallets.names[walletAddress] = $("#inputWalletName").val();
      DUBXDatatabse.setWallets(wallets);

      $('#dlgChangeWalletName').iziModal('close');
      DUBXFWallets.renderWalletsState();
    }

    $("#btnChangeWalletNameConfirm").off('click').on('click', function() {
      doChangeWalletName();
    });

    $("#dlgChangeWalletName").off('keypress').on('keypress', function(e) {
      if(e.which == 13) {
        doChangeWalletName();
      }
    });
  });

  $("#btnRefreshAddress").off('click').on('click', function() {
    DUBXWallets.renderWalletsState();
  });

  $("#btnExportAccounts").off('click').on('click', function() {
    ipcRenderer.send('exportAccounts', {});
  });

  $("#btnImportAccounts").off('click').on('click', function() {
    var ImportResult = ipcRenderer.sendSync('importAccounts', {});

    if (ImportResult.success) {
      iziToast.success({
        title: 'Imported',
        message: ImportResult.text,
        position: 'topRight',
        timeout: 2000
      });
    } else if (ImportResult.success == false) {
      DUBXMainGUI.showGeneralError(ImportResult.text);
    }

  });

  $("#btnImportFromPrivateKey").off('click').on('click', function() {
    $("#dlgImportFromPrivateKey").iziModal();
    $("#inputPrivateKey").val("");
    $('#dlgImportFromPrivateKey').iziModal('open');

    function doImportFromPrivateKeys() {
      // var account = DUBXBlockchain.importFromPrivateKey($("#inputPrivateKey").val());
      $('#dlgImportFromPrivateKey').iziModal('close');

      // if (account) {
      //   ipcRenderer.sendSync('saveAccount', account[0]);
      //   DUBXWallets.renderWalletsState();

      //   iziToast.success({
      //     title: 'Imported',
      //     message: "Account was succesfully imported",
      //     position: 'topRight',
      //     timeout: 2000
      //   });

      // } else {
      //   DUBXMainGUI.showGeneralError("Error importing account from private key!");
      // }
      if (DUBXWallets.validateImportFromKeyForm()) {
        var account = DUBXBlockchain.importFromPrivateKey($("#inputPrivateKey").val(), $("#keyPasswordFirst").val(), function (error) {
          DUBXMainGUI.showGeneralError(error);
        }, function (account) {
          if (account) {
            DUBXWallets.renderWalletsState();
            iziToast.success({title: "Imported", message: "Account was succesfully imported", position: "topRight", timeout: 2000});
          } else {
            DUBXMainGUI.showGeneralError("Error importing account from private key!");
          }
        });
      }
    }

    $("#btnImportFromPrivateKeyConfirm").off('click').on('click', function() {
      doImportFromPrivateKeys();
    });

    $("#dlgImportFromPrivateKey").off('keypress').on('keypress', function(e) {
      if(e.which == 13) {
        doImportFromPrivateKeys();
      }
    });
  });

  $(".textAddress").off('click').on('click', function() {
    DUBXMainGUI.copyToClipboard($(this).html());

    iziToast.success({
      title: 'Copied',
      message: 'Address was copied to clipboard',
      position: 'topRight',
      timeout: 2000
    });
  });
});

// event that tells us that geth is ready and up
$(document).on("onGdubxReady", function() {
  DUBXMainGUI.changeAppState("account");
  DUBXWallets.renderWalletsState();
});

$(document).on("onNewAccountTransaction", function() {
  if (DUBXMainGUI.getAppState() == "account") {
    DUBXWallets.renderWalletsState();
  }
});

DUBXWallets = new Wallets();
