// In renderer process (web page).
const { ipcRenderer } = require("electron");

class SendTransaction {
  constructor() {}

  enableSendButtonTooltips() {
    DUBXUtils.createToolTip(
      "#btnAddToAddressBook",
      "Add this Address to AddressBook"
    );
    DUBXUtils.createToolTip(
      "#btnLookForToAddress",
      "Look for Existing Address"
    );
  }

  renderSendState() {
    DUBXBlockchain.getAccountsData(
      function (error) {
        DUBXMainGUI.showGeneralError(error);
      },
      function (data) {
        DUBXMainGUI.renderTemplate("send.html", data);
        $(document).trigger("render_send");
      }
    );
  }

  validateSendForm() {
    if (DUBXMainGUI.getAppState() == "send") {
      let currentAddr = $("#sendFromAddress").val();
      if (!$("#sendFromAddress").val()) {
        DUBXMainGUI.showGeneralError("Sender address must be specified!");
        return false;
      }

      if (!DUBXBlockchain.isAddress($("#sendFromAddress").val())) {
        DUBXMainGUI.showGeneralError("Sender address must be a valid address!");
        return false;
      }

      if (!$("#sendToAddress").val()) {
        DUBXMainGUI.showGeneralError("Recipient address must be specified!");
        return false;
      }

      if (!DUBXBlockchain.isAddress($("#sendToAddress").val())) {
        DUBXMainGUI.showGeneralError(
          "Recipient address must be a valid address!"
        );
        return false;
      }

      if (Number($("#sendAmmount").val()) <= 0) {
        DUBXMainGUI.showGeneralError("Send amount must be greater then zero!");
        return false;
      }

      if (Number($("#sendAmmount").val()) > Number($("#tokenBalance").val())) {
        DUBXMainGUI.showGeneralError(
          "Send amount must be less then the total balance! Don't forget to leave some DUBX for fee."
        );
        return false;
      }
      return true;
    } else {
      return false;
    }
  }

  resetSendForm() {
    if (DUBXMainGUI.getAppState() == "send") {
      $("#sendToAddressName").html("");
      $("#sendToAddress").val("");
      $("#sendAmmount").val(0);
    }
  }
}

$(document).on("render_send", function () {
  $("select#sendFromAddress").formSelect({
    classes: "fromAddressSelect",
  });
  $("select#tokens").formSelect({
    classes: "tokenValue",
  });

  DUBXSend.enableSendButtonTooltips();

  $("#btnSendAll")
    .off("click")
    .on("click", function () {
      $("#sendAmmount").focus();
      $("#sendAmmount").val($("#sendMaxAmmount").html());
    });

  $("#sendToAddress")
    .off("input")
    .on("input", function () {
      var addressName = null;
      $("#sendToAddressName").html("");
      addressName = DUBXAddressBook.getAddressName($("#sendToAddress").val());

      if (!addressName) {
        var wallets = DUBXDatatabse.getWallets();
        addressName = wallets.names[$("#sendToAddress").val()];
      }
      $("#sendToAddressName").html(addressName);
    });

  $("#sendFromAddress")
    .off("change")
    .on("change", function () {
      var optionText = $(this).find("option:selected").text();
      var addrName = optionText.substr(0, optionText.indexOf("-"));
      var addrValue = optionText
        .substr(optionText.indexOf("-") + 1)
        .substring(1);
      var addr42 = addrValue.slice(0, 42);
      console.log(addr42);
      var isDUBXSelected = $("#tokens").find("option:selected").text();
      if (isDUBXSelected === "DUBX") {
        $("#tokenBalance").val(totalAmount);
      }
      // function getBinarBalance(addr42) {
      //     var abi = [{
      //         "constant": true,
      //         "inputs": [{
      //             "name": "_owner",
      //             "type": "address"
      //         }],
      //         "name": "balanceOf",
      //         "outputs": [{
      //             "name": "balance",
      //             "type": "uint256"
      //         }],
      //         "payable": false,
      //         "stateMutability": "view",
      //         "type": "function"
      //     }];

      //     var contract = new web3Local.eth.Contract(abi, "0x5157adC7156984520F2Aeb94247E6268f3091b6B");
      //     var binarHolder = addr42;
      //     contract.methods.balanceOf(binarHolder).call().then(function (binarBalanceTotal) {
      //         $("#tokenBalance").val(binarBalanceTotal);
      //     });
      // }

      // function getSzarBalance(addr42) {
      //     var abi = [{
      //         "constant": true,
      //         "inputs": [{
      //             "name": "_owner",
      //             "type": "address"
      //         }],
      //         "name": "balanceOf",
      //         "outputs": [{
      //             "name": "balance",
      //             "type": "uint256"
      //         }],
      //         "payable": false,
      //         "stateMutability": "view",
      //         "type": "function"
      //     }];

      //     var contract = new web3Local.eth.Contract(abi, "0x52CD8E72B438E362F0235080DD63EDb61B740656");
      //     var szarHolder = addr42;
      //     contract.methods.balanceOf(szarHolder).call().then(function (szarBalanceTotal) {
      //         $("#tokenBalance").val(szarBalanceTotal);
      //     });
      // }

      var totalAmount = parseFloat(addrValue.trim().substring(45));
      $("#tokenBalance").val(totalAmount);
      $(".tokenValue input").html(totalAmount);

      $(".fromAddressSelect input").val(addrValue.trim().slice(0, 42));
      $("#sendFromAddressName").html(addrName.trim());

      $("#tokens")
        .off("change")
        .on("change", function () {
          var currencySelected = $(this).find("option:selected").text();
          if (currencySelected === "DUBX") {
            $("#tokenBalance").val(totalAmount);

            // } else if (currencySelected === "BINAR") {
            //     getBinarBalance(addr42);
            // } else if (currencySelected === "SZAR") {
            //     getSzarBalance(addr42);
          }
        });
    });

  $("#btnLookForToAddress")
    .off("click")
    .on("click", function () {
      DUBXBlockchain.getAddressListData(
        function (error) {
          DUBXMainGUI.showGeneralError(error);
        },
        function (addressList) {
          var addressBook = DUBXAddressBook.getAddressList();

          for (var key in addressBook) {
            if (addressBook.hasOwnProperty(key)) {
              var adddressObject = {};
              adddressObject.address = key;
              adddressObject.name = addressBook[key];
              addressList.addressData.push(adddressObject);
            }
          }

          $("#dlgAddressList").iziModal({
            width: "800px",
          });
          DUBXMainGUI.renderTemplate(
            "addresslist.html",
            addressList,
            $("#dlgAddressListBody")
          );
          $("#dlgAddressList").iziModal("open");

          $(".btnSelectToAddress")
            .off("click")
            .on("click", function () {
              $("#sendToAddressName").html($(this).attr("data-name"));
              $("#sendToAddress").val($(this).attr("data-wallet"));
              $("#dlgAddressList").iziModal("close");
            });

          $("#addressListFilter")
            .off("input")
            .on("input", function (e) {
              DUBXUtils.filterTable(
                $("#addressTable"),
                $("#addressListFilter").val()
              );
            });

          $("#btnClearSearchField")
            .off("click")
            .on("click", function () {
              DUBXUtils.filterTable($("#addressTable"), "");
              $("#addressListFilter").val("");
            });
        }
      );
    });

  $("#btnAddToAddressBook")
    .off("click")
    .on("click", function () {
      if (DUBXBlockchain.isAddress($("#sendToAddress").val())) {
        $("#dlgAddAddressToBook").iziModal();
        $("#inputAddressName").val("");
        $("#dlgAddAddressToBook").iziModal("open");

        function doAddAddressToAddressBook() {
          DUBXAddressBook.setAddressName(
            $("#sendToAddress").val(),
            $("#inputAddressName").val()
          );
          $("#dlgAddAddressToBook").iziModal("close");

          iziToast.success({
            title: "Success",
            message: "Address was added to address book",
            position: "topRight",
            timeout: 2000,
          });
        }
      } else {
        DUBXMainGUI.showGeneralError("Recipient address is not valid!");
      }

      $("#btnAddAddressToBookConfirm")
        .off("click")
        .on("click", function () {
          doAddAddressToAddressBook();
        });

      $("#dlgAddAddressToBook")
        .off("keypress")
        .on("keypress", function (e) {
          if (e.which == 13) {
            doAddAddressToAddressBook();
          }
        });
    });

  $("#btnSendTransaction")
    .off("click")
    .on("click", function () {
      if (DUBXSend.validateSendForm()) {
        let tokenTransaction = false;
        var token = $("#tokens").find("option:selected").text();
        let contractAddress = "";
        if (token === "DUBX") {
          tokenTransaction = false;
          contractAddress = $("#sendToAddress").val();
          // } else if (token === "BINAR") {
          //     tokenTransaction = true;
          //     contractAddress = '0x5157adC7156984520F2Aeb94247E6268f3091b6B';
          // } else if (token === "SZAR") {
          //     tokenTransaction = true;
          //     contractAddress = '0x52CD8E72B438E362F0235080DD63EDb61B740656';
        }
        DUBXBlockchain.getTranasctionFee(
          $("#sendFromAddress").val(),
          contractAddress,
          $("#sendAmmount").val(),
          function (error) {
            DUBXMainGUI.showGeneralError(error);
          },
          function (data) {
            $("#dlgSendWalletPassword").iziModal();
            $("#walletPassword").val("");
            $("#fromAddressInfo").html($("#sendFromAddress").val());
            $("#toAddressInfo").html($("#sendToAddress").val());
            $("#valueToSendInfo").html($("#sendAmmount").val());
            $(".currencyTicker").html(token);
            $("#feeToPayInfo").html(
              parseFloat(web3Local.utils.fromWei(data.toString(), "ether"))
            );
            $("#dlgSendWalletPassword").iziModal("open");

            function doSendTransaction() {
              $("#dlgSendWalletPassword").iziModal("close");
              if (tokenTransaction) {
                DUBXBlockchain.prepareTokenTransaction(
                  contractAddress,
                  $("#walletPassword").val(),
                  $("#sendFromAddress").val(),
                  $("#sendToAddress").val(),
                  $("#sendAmmount").val(),
                  function (error) {
                    DUBXMainGUI.showGeneralError(error);
                  },
                  function (data) {
                    DUBXBlockchain.sendTransaction(
                      data.raw,
                      function (error) {
                        DUBXMainGUI.showGeneralError(error);
                      },
                      function (data1) {
                        DUBXSend.resetSendForm();
                        iziToast.success({
                          title: "Sent",
                          message:
                            "Transaction was successfully sent to the chain",
                          position: "topRight",
                          timeout: 5000,
                        });

                        DUBXBlockchain.getTransaction(
                          data1,
                          function (error) {
                            DUBXMainGUI.showGeneralError(error);
                          },
                          function (transaction) {
                            console.log("transaction", transaction);
                            var amount = web3Local.utils.fromWei(
                              transaction.value,
                              "ether"
                            );
                            var timeTx = transaction.timestamp;
                            ipcRenderer.send("storeTransaction", {
                              block: transaction.blockNumber,
                              txhash: transaction.hash.toLowerCase(),
                              fromaddr: transaction.from.toLowerCase(),
                              timestamp: timeTx,
                              toaddr: transaction.to.toLowerCase(),
                              value: amount,
                            });
                          }
                        );
                      }
                    );
                  }
                );
              } else if (token === "DUBX") {
                DUBXBlockchain.prepareTransaction(
                  $("#walletPassword").val(),
                  $("#sendFromAddress").val(),
                  $("#sendToAddress").val(),
                  $("#sendAmmount").val(),
                  function (error) {
                    DUBXMainGUI.showGeneralError(error);
                  },
                  function (data) {
                    DUBXBlockchain.sendTransaction(
                      data.raw,
                      function (error) {
                        DUBXMainGUI.showGeneralError(error);
                      },
                      function (data1) {
                        DUBXSend.resetSendForm();
                        iziToast.success({
                          title: "Sent",
                          message:
                            "Transaction was successfully sent to the chain",
                          position: "topRight",
                          timeout: 5000,
                        });

                        DUBXBlockchain.getTransaction(
                          data1,
                          function (error) {
                            DUBXMainGUI.showGeneralError(error);
                          },
                          function (transaction) {
                            console.log("transaction", transaction);
                            var amount = web3Local.utils.fromWei(
                              transaction.value,
                              "ether"
                            );
                            var timeTx = transaction.timestamp;
                            ipcRenderer.send("storeTransaction", {
                              block: transaction.blockNumber,
                              txhash: transaction.hash.toLowerCase(),
                              fromaddr: transaction.from.toLowerCase(),
                              timestamp: timeTx,
                              toaddr: transaction.to.toLowerCase(),
                              value: amount,
                            });
                          }
                        );
                      }
                    );
                  }
                );
              }
            }

            $("#btnSendWalletPasswordConfirm")
              .off("click")
              .on("click", function () {
                doSendTransaction();
              });

            $("#dlgSendWalletPassword")
              .off("keypress")
              .on("keypress", function (e) {
                if (e.which == 13) {
                  doSendTransaction();
                }
              });
          }
        );
      }
    });
});

// create new account variable
DUBXSend = new SendTransaction();
