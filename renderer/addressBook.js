const {ipcRenderer} = require('electron');

class AddressBook {
  constructor() {
  }

  setAddressName(address, name) {
    var addressBook = DUBXDatatabse.getAddresses();

    // set the wallet name from the dialog box
    addressBook.names[address] = name;
    DUBXDatatabse.setAddresses(addressBook);
  }

  getAddressName(address) {
    var addressBook = DUBXDatatabse.getAddresses();
    // set the wallet name from the dialog box
    return addressBook.names[address.toUpperCase()] || "";
  }

  getAddressList() {
    var addressBook = DUBXDatatabse.getAddresses();
    return addressBook.names;
  }

  deleteAddress(address) {
    var addressBook = DUBXDatatabse.getAddresses();
    delete addressBook.names[address];
    DUBXDatatabse.setAddresses(addressBook);
  }

  enableButtonTooltips() {
  }

  renderAddressBook() {
    var addressObject = DUBXAddressBook.getAddressList();
    var renderData = { addressData: [] };

    for (var key in addressObject) {
      if (addressObject.hasOwnProperty(key)) {
        var addressEntry = {};
        addressEntry.name = addressObject[key];
        addressEntry.address = key;
        renderData.addressData.push(addressEntry);
      }
    }

    // render the wallets current state
    DUBXMainGUI.renderTemplate("addressBook.html", renderData);
    $(document).trigger("render_addressBook");
    DUBXAddressBook.enableButtonTooltips();
  }
}

// the event to tell us that the wallets are rendered
$(document).on("render_addressBook", function() {
  $("#btnNewAddress").off('click').on('click', function() {
    $("#dlgCreateAddressAndName").iziModal();
    $("#addressName").val("");
    $("#addressHash").val("");
    $('#dlgCreateAddressAndName').iziModal('open');

    function doCreateNewWallet() {
      $('#dlgCreateAddressAndName').iziModal('close');

      if (!DUBXBlockchain.isAddress($("#addressHash").val())) {
        DUBXMainGUI.showGeneralError("Address must be a valid address!");
      } else {
        DUBXAddressBook.setAddressName($("#addressHash").val(), $("#addressName").val());
        DUBXAddressBook.renderAddressBook();

        iziToast.success({
          title: 'Created',
          message: 'New address was successfully created',
          position: 'topRight',
          timeout: 5000
        });

      }
    }

    $("#btnCreateAddressConfirm").off('click').on('click', function() {
      doCreateNewWallet();
    });

    $("#dlgCreateAddressAndName").off('keypress').on('keypress', function(e) {
      if(e.which == 13) {
        doCreateNewWallet();
      }
    });
  });

  $(".btnChangAddressName").off('click').on('click', function() {
    var walletAddress = $(this).attr('data-address');
    var walletName = $(this).attr('data-name');

    $("#dlgChangeAddressName").iziModal();
    $("#inputAddressName").val(walletName);
    $('#dlgChangeAddressName').iziModal('open');

    function doChangeAddressName() {
      DUBXAddressBook.setAddressName(walletAddress, $("#inputAddressName").val());
      $('#dlgChangeAddressName').iziModal('close');
      DUBXAddressBook.renderAddressBook();
    }

    $("#btnChangeAddressNameConfirm").off('click').on('click', function() {
      doChangeAddressName();
    });

    $("#dlgChangeAddressName").off('keypress').on('keypress', function(e) {
      if(e.which == 13) {
        doChangeAddressName();
      }
    });
  });

  $(".btnDeleteAddress").off('click').on('click', function() {
    var deleteAddress = $(this).attr('data-address');

    $("#dlgDeleteAddressConfirm").iziModal();
    $('#dlgDeleteAddressConfirm').iziModal('open');

    $("#btnDeleteAddressCancel").off('click').on('click', function() {
      $('#dlgDeleteAddressConfirm').iziModal('close');
    });

    $("#btnDeleteAddressConfirm").off('click').on('click', function() {
      $('#dlgDeleteAddressConfirm').iziModal('close');
      DUBXAddressBook.deleteAddress(deleteAddress);
      DUBXAddressBook.renderAddressBook();
    });
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

DUBXAddressBook = new AddressBook();
