ShareApp.controller("UsersDashboardController", ["$scope", "$rootScope", "$uibModal", "$http", "$q", "$timeout", "SharewebListService", "SharewebCommonFactoryService", "GlobalConstants",
    function ($scope, $rootScope, $uibModal, $http, $q, $timeout, SharewebListService, SharewebCommonFactoryService, GlobalConstants) {
        $scope.orderBy = 'Modified';
        $scope.reverse = true;
		$scope.siteUrl = GlobalConstants.MAIN_SITE_URL;
		$scope.currentuser = _spPageContextInfo.userId;
        $scope.itemdisplay = false;

        /*******************Code done by avinash ******************************************/
		/* ------Start of code to show edit and delete icon-------*/
        $scope.isSiteOwner = function () {
            SharewebCommonFactoryService.IsCurrentUserSiteOwner()
                .then(function (IsSiteAdmin) {
                    $scope.isOwner = IsSiteAdmin;
                });
        }
		$scope.isSiteOwner();

		$scope.isMemberSiteOwner = function () {
			SharewebCommonFactoryService.IsCurrentMemberSiteOwner()
				.then(function (IsMemberOwner) {
					$scope.isMemberOwner = IsMemberOwner;
				});
		}
		$scope.isMemberSiteOwner();

		 /*******************End to show edit and delete icon ******************************************/
		$scope.toggleGroupSmart = function (group) {
			group.expanded = !group.expanded;
		};
		
		/*******************Start of code to sort*******************/
		$scope.sortBy = function (propertyName, order) {
			$scope.reverse = order;
			$scope.orderBy = propertyName;
		};
		/*******************END of code to sort*******************/

       /*******************Start of code to clear individeal search columns and clear all ******************************************/
        $scope.clearControl = function (cntrlId, category) {
            switch (cntrlId) {
                case ' globalSearch':
					category.globalSearch = undefined;
                    break;
                case 'searchTaskName':
					category.searchTaskName = undefined;
                    break;
                case 'searchPercentComplete':
					category.searchPercentComplete = undefined;
                    break;
                case 'searchPriority':
					category.searchPriority = undefined;
                    break;
                case 'searchModified':
					category.searchModified = undefined;
                    break;
                case 'searchDueDate':
					category.searchDueDate = undefined;
                    break;
            }
		};
		$scope.ClearFilters = function () {
			$scope.globalSearch = undefined;
			$scope.searchTaskName = undefined;
			$scope.searchPercentComplete = undefined;
			$scope.searchPriority = undefined;
			$scope.searchModified = undefined;
			$scope.searchDueDate = undefined;
			
		}
		/*******************END of code to clear individeal search columns and clear all ******************************************/

        /*******************start of code to get child of an item*******************/

        $scope.getChilds = function (item, items) {
            item.tasks = [];
			angular.forEach(items, function (childItem) {
				if (childItem.AssignedTo != undefined) {
					angular.forEach(childItem.AssignedTo.results, function (userDetail) {
						if (userDetail.Id != undefined && userDetail.Id == item.AssingedToUserId) {
							item.tasks.push(childItem);
						}
					})
				}
				
            });
        }
         /*******************END of code to get child of an item*******************/

		 /*******************start of code to load team members*******************/
		
		$scope.loadTeamMembers = function () {
			$scope.TeamMembers = [];
			var me = SharewebCommonFactoryService.getParameterByName('view');
			SharewebListService.getRequest(GlobalConstants.ADMIN_SITE_URL, "/getbyid('" + GlobalConstants.ADMIN_TASK_USERS_LISTID + "')/items?$select=Title,Status,Group,Role,Item_x0020_Cover,AssingedToUserId")
				.then(function (data) {
					if (me == 'me') {
						$scope.Col = 12;
						angular.forEach(data.d.results, function (item) {
							if ($scope.currentuser == item.AssingedToUserId) {
								
								$scope.TeamMembers.push(item)
							}
					})
					}
					if (me == '') {
						$scope.Col = 6;
						$scope.TeamMembers = angular.copy(data.d.results);
					}
					console.log($scope.TeamMembers);
					angular.forEach($scope.TeamMembers, function (user) {
						//user.Col = 6;
						user.expanded = true;
						$scope.getChilds(user, $scope.AllSitesTasks);
					})
					SharewebCommonFactoryService.hideProgressBar();
				},
				function (error) {
					SharewebCommonFactoryService.handleError(error);

				});
		};
		 /*******************END of code to load team members*******************/

		 /*******************start of code to sites*******************/
		$scope.LoadAllMetaData = function () {
			$scope.SitesConfig = [];
			$scope.UsersItems = [];
			SharewebCommonFactoryService.LoadAllMetaData()
				.then(function (AllMetaData) {
					$scope.AllMetaData = angular.copy(AllMetaData);
					$scope.SitesConfig = SharewebCommonFactoryService.getSmartMetadataItemsByTaxType(AllMetaData, 'Sites');
					$scope.loadAllSitesTask();
					
				},
				function (data) {

				});
		}
		$scope.LoadAllMetaData();
		/*******************END of code to sites*******************/

		/*******************start of code to load all sites tasks*******************/
        $scope.loadAllSitesTask = function () {
			SharewebCommonFactoryService.showProgressBar();
            $scope.AllSitesTasks = [];
            var query = "Priority_x0020_Rank,Team_x0020_Members/Title,Team_x0020_Members/Name,Team_x0020_Members/Id,Item_x002d_Image,component_x0020_link,AssignedTo/Title,AssignedTo/Name,AssignedTo/Id,AttachmentFiles/FileName,FileLeafRef,FeedBack,Categories,Title,Id,PercentComplete,Comments,Company,FeedBack,StartDate,DueDate,Status,Body,Mileage,PercentComplete,Attachments,Priority,Created,Modified,Author/Id,Author/Title,Editor/Id,Editor/Title&$expand=AssignedTo,Team_x0020_Members,AttachmentFiles,Author,Editor&$orderby=DateModified desc&$top=4999&$filter=Status ne 'Completed'";
            SharewebCommonFactoryService.loadAllSitesTask($scope.SitesConfig, query)
                .then(function (AllSitesTask) {
					$scope.AllSitesTasks = [];
					angular.forEach(AllSitesTask, function (item) {
						if (item.DueDate != undefined) {
							if (item.Track == undefined) {
								var dueDate = SharewebCommonFactoryService.ConvertLocalTOServerDate(item.DueDate, 'MM/DD/YYYY');
								item.TrackTask = $scope.getDueDateTrack(dueDate);
							}
							else {
								item.TrackTask = item.Track;
							}
						}
						if (item.PercentComplete != undefined && item.PercentComplete != 100) {
							
							$scope.AllSitesTasks.push(item);
						}
					})
					$scope.loadTeamMembers();
					$scope.sortBy('DateModified', true);
                },
                function (error) {
                    //SharewebCommonFactoryService.hideProgressBar('showSmartMetaSearchTaskprogressbar');
                    SharewebCommonFactoryService.handleError(error);
                });
        }
		/*******************END of code to load all sites tasks*******************/
		$scope.getDueDateTrack = function (dueDate) {
			var dueDateTrack;
			var startDate = SharewebCommonFactoryService.ConvertLocalTOServerDate(new Date(), 'MM/DD/YYYY');
			startDate = moment(startDate);
			var dueDate = moment(dueDate);
			var diff = dueDate.diff(startDate, 'days');
			var getday = new Date(startDate).getDay();
			if (diff < 0 && diff != -1)
				dueDateTrack = 'Off Track';
			if (diff == 0 || diff == -1)
				dueDateTrack = 'Slightly Off Track';
			if (diff > 0)
				dueDateTrack = 'On Track';
			return dueDateTrack;
		}
        /**** Strat of code to open edit button ********/
		$scope.EditItemCallBack = function (updatedTask) {
		    console.log('task Id: ' + updatedTask.Id);
		    angular.forEach($scope.TeamMembers, function (site) {
		        angular.forEach(site.tasks, function (task, index) {
		            if (task.Id == updatedTask.Id && task.siteType == updatedTask.siteType) {
		                site.tasks[index] = updatedTask;
		                console.log('updated in AllSitesTasks: ' + updatedTask.Id);
		            }
		        });
		    });
		}
		$scope.EditTask = function (item) {
		    SharewebCommonFactoryService.showProgressBar();
		    var listId = SharewebCommonFactoryService.getListIdByListName(item.siteType);
		    var imagedetails = {};
		    angular.forEach($scope.SitesConfig, function (site) {
		        if (item.siteType != undefined && item.siteType == site.Title) {
		            imagedetails = site;
		        }
		    });
		    setTimeout(function () {
		        $rootScope.modalInstance = $uibModal.open({
                    templateUrl: _spPageContextInfo.siteAbsoluteUrl + '/Style%20Library/js/angular/Templates/TestHCTaskManagement.html',
		            controller: 'HCTaskManagementController',
		            backdrop: "static",
		            size: 'lg'
		        });
		        $rootScope.modalInstance.item = item;
		        $rootScope.modalInstance.parentScope = $scope;
		        $rootScope.modalInstance.listId = listId;
		        $rootScope.modalInstance.SiteImage = imagedetails;
		    }, 10);
		};
        /**** End of code to open edit button ********/
       
        /*******************start of code to delete task******************************************/
         $scope.deleteitem = function (item, array) {
             var listId = SharewebCommonFactoryService.getListIdByListName(item.siteType);
            angular.forEach(array, function (olditem, index) {
                if (olditem.siteType == item.siteType && olditem.Id == item.Id) {
                    array.splice(index, 1);

                }
            })
            SharewebCommonFactoryService.removeItem($scope.listId, item.Id, GlobalConstants.ADMIN_SITE_URL, "")

        }
        /*******************End delete ******************************************/
    }]);

