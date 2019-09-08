app.service('fileUploadService', function ($http, $q) {
 
        this.uploadFileToUrl = function (file, uploadUrl, name, items) {
            //FormData, object of key/value pair for form fields and values
            var fileFormData = new FormData();
            fileFormData.append('name', name);
            fileFormData.append('items', items);
            fileFormData.append('file', file);
 			console.log(fileFormData);
            var deffered = $q.defer();
            $http.post(uploadUrl, fileFormData, {
                transformRequest: angular.identity,
                headers: {'Content-Type': undefined}
 
            }).then(function (response) {
                deffered.resolve(response);
 				
            }, function (response) {
                deffered.reject(response);
            });
 
            return deffered.promise;
        }
    });