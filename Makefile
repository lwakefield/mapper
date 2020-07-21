relink-lib:
	cd frontend1 && yarn add file:../lib
	cd backend && yarn add file:../lib
