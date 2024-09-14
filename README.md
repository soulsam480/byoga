## Byoga

> drawing in japanese

## What is this ?

- read bank statements
- feed to db
- store
- analyse and show with charts

## Screenshots
![image](https://github.com/user-attachments/assets/893d4215-af37-4763-9614-9c689cf00547)
![image](https://github.com/user-attachments/assets/4c61ee76-3779-4e5d-8ad5-ae00fb26f091)
![image](https://github.com/user-attachments/assets/a9a4acb5-2b87-45a9-a0ac-908a1d9494b5)


## Roadmap
- [ ] budgets
	- [ ] spend monthly
	- [ ] per cat tracking ?
- [ ] savings
	- [ ] per month savings tracking
- [ ] implement statement consumer framework
	- [ ] parser
		- understand bounds of statement and where to start/end parsing
		- converting csv rows to SQL row-able data
	- [ ] transformer
		- convert raw csv row to sql row data
	- [ ] meta parser
		- pluggable meta parser based on meta info type
		- for example, for IDFC it's a string

Analysis
- [ ] heat points
	- [ ] time of day
	- [ ] day of week
	- [ ] category
	- [ ] combinations
- [ ] detect recurring spends automatically and show in dash
