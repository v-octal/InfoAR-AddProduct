app.controller("FormController", function($scope, fileUploadService) {
	$scope.uploadFile = function () {
        var file = $scope.data.myFile;
        var name = $scope.data.name;
        var items = $scope.data.items;
        var uploadUrl = "https://us-central1-building-serverless-apps.cloudfunctions.net/uploadFile", //Url of webservice/api/server
            promise = fileUploadService.uploadFileToUrl(file, uploadUrl, name, items);
 
        promise.then(function (response) {
            $scope.serverResponse = response;
            $scope.data = {};
            angular.element("input[type='file']").val(null);
        }, function () {
        	$scope.data = {};
            $scope.serverResponse = 'An error has occurred';
        })
    };
});