angular.module('OTEHP', [])

.controller('MainController', function($scope, $location) {
  $scope.$location = $location;

  $scope.tokenInfos = []; // id of token => object of infos

  // Main canvas 
  $scope.cHOTID = 0; // currently hovered over token iD

  $scope.updateCHOTID = function (currentlyHoveredOverTokenID) {
    $scope.cHOTID = currentlyHoveredOverTokenID; 
    $scope.$apply();
  }

  $scope.cHOTID_clicked = 0; 

  $scope.updateCHOTID_clicked = function () {
    $scope.cHOTID_clicked = $scope.cHOTID 
    $scope.$apply();
  }

  // Big pixels canvas

  $scope.cHOSquare = 0; // currently hovered over square

  $scope.updateCHOSquare = function (currentlyHoveredOverSquare) {
    $scope.cHOSquare = currentlyHoveredOverSquare; 
    $scope.$apply();
  }  

  $scope.getEvents = function () {
    OMPContract.deployed().then(function(instance) {
      instance.EmitChangedPixelsColors({}, { fromBlock: 0, toBlock: 'latest' }).watch((error, eventResult) => {
        if (error)
          console.log('Error in EmitInitialAuction event handler: ' + error);
        else {
          OMPContract.deployed().then(function(instance) {
            return instance.tokenToPixelsColors.call(eventResult.args._tokenId);
          }).then(function(result) {
            //console.log(eventResult.args._tokenId)
            //console.log(result)
            $scope.tokenInfos[eventResult.args._tokenId].colorsString = result;
            $scope.tokenInfos[eventResult.args._tokenId].colorsArray = stringToArrayOfStrings(result);
            paintCanvasSquareFromEvents(eventResult.args._tokenId, $scope.tokenInfos[eventResult.args._tokenId].colorsArray);
            $scope.$apply();
          }).catch(function(err) {
            console.log(err)
          });
        }
      });

      instance.EmitChangedDescription({}, { fromBlock: 0, toBlock: 'latest' }).watch((error, eventResult) => {
        if (error)
          console.log('Error in EmitChangedDescription event handler: ' + error);
        else {
          OMPContract.deployed().then(function(instance) {
            return instance.tokenToDescription.call(eventResult.args._tokenId);
          }).then(function(result) {
            $scope.tokenInfos[eventResult.args._tokenId].description = result;
            $scope.$apply();
          }).catch(function(err) {
            console.log(err)
          });
        }
      });

      instance.EmitChangedLink({}, { fromBlock: 0, toBlock: 'latest' }).watch((error, eventResult) => {
        if (error)
          console.log('Error in EmitChangedLink event handler: ' + error);
        else {
          OMPContract.deployed().then(function(instance) {
            return instance.tokenToLink.call(eventResult.args._tokenId);
          }).then(function(result) {
            $scope.tokenInfos[eventResult.args._tokenId].link = result;
            $scope.$apply();
          }).catch(function(err) {
            console.log(err)
          });
        }
      });

      instance.EmitBought({}, { fromBlock: 0, toBlock: 'latest' }).watch((error, eventResult) => {
        if (error)
          console.log('Error in EmitInitialAuction event handler: ' + error);
        else {
          console.log('Parcel bought')
          $scope.tokenInfos[eventResult.args._tokenId] = {
            owner : ""
          };

          OMPContract.deployed().then(function(instance) {
            return instance.ownerOf.call(eventResult.args._tokenId);
          }).then(function(result) {
            $scope.tokenInfos[eventResult.args._tokenId].owner = result;
            if($scope.tokenInfos[eventResult.args._tokenId].colorsArray == null) {
              $scope.tokenInfos[eventResult.args._tokenId].colorsArray = [];
            }

            if($scope.tokenInfos[eventResult.args._tokenId].description == null) {
              $scope.tokenInfos[eventResult.args._tokenId].description = "";
            }

            if($scope.tokenInfos[eventResult.args._tokenId].link == null) {
              $scope.tokenInfos[eventResult.args._tokenId].link = "";
            }

            $scope.$apply();
          }).catch(function(err) {
            console.log(err)
          });
        }
      });

    }).catch(function(err) {
      console.log(err.message);
    });
  }

  $scope.infosPopUp = false;

  $scope.showInfosPopUp = function () {
    $scope.infosPopUp = true;
    $scope.$apply();
  }

  $scope.hideInfosPopUp = function () {
    $scope.infosPopUp = false;
    $scope.$apply();
  }

  $scope.buyToken = function () {
    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      } else {
        if(accounts.length <= 0) {
          alert("No account is unlocked, please authorize an account on Metamask.")
        } else {
          OMPContract.deployed().then(function(instance) {
            return instance.initialBuyToken($scope.cHOTID_clicked, {from: accounts[0], value: web3.toWei(100, "finney") });
          }).then(function(result) {
            alert('Parcel successfully bought!');         
          }).catch(function(err) {
            console.log(err.message);
            alert('Something went wrong when trying to acquire the parcel.');
          });
        }
      }
    });
  }

  $scope.saveColors = function () {
    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      } else {
        if(accounts.length <= 0) {
          alert("No account is unlocked, please authorize an account on Metamask.")
        } else {
          OMPContract.deployed().then(function(instance) {
            var _newColors = arrayOfColorsToString($scope.tokenInfos[$scope.cHOTID_clicked].colorsArray)
            
            return instance.setTokenPixelsColors($scope.cHOTID_clicked, _newColors, {from: accounts[0] });
          }).then(function(result) {
            alert('Pixels colors successfully changed!');
          }).catch(function(err) {
            console.log(err.message);
            alert('Something went wrong when trying to change the pixels colors of the parcel.');
          });
        }
      }
    });
  }

  $scope.saveDescription = function () {
    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      } else {
        if(accounts.length <= 0) {
          alert("No account is unlocked, please authorize an account on Metamask.")
        } else {
          OMPContract.deployed().then(function(instance) {
            var _newDescription = $scope.tokenInfos[$scope.cHOTID_clicked].description;
            
            return instance.setTokenDescription($scope.cHOTID_clicked, _newDescription, {from: accounts[0] });
          }).then(function(result) {
            alert('Description successfully changed!');       
          }).catch(function(err) {
            console.log(err.message);
            alert('Something went wrong when trying to change the description of the parcel.');
          });
        }
      }
    });
  }

  $scope.saveLink = function () {
    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      } else {
        if(accounts.length <= 0) {
          alert("No account is unlocked, please authorize an account on Metamask.")
        } else {
          OMPContract.deployed().then(function(instance) {
            var _newLink = $scope.tokenInfos[$scope.cHOTID_clicked].link;
            
            return instance.setTokenLink($scope.cHOTID_clicked, _newLink, {from: accounts[0] });
          }).then(function(result) {
            alert('Link successfully changed!');       
          }).catch(function(err) {
            console.log(err.message);
            alert('Something went wrong when trying to change the link of the parcel.');
          });
        }
      }
    });
  }

  $scope.currentAccount = "";

  $scope.setCurrentUnlockedAccount = function (currentlyUnlockedAccount) {
    $scope.currentAccount = currentlyUnlockedAccount;
    $scope.$apply();
  }

  initWeb3();
});