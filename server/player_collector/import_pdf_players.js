// Direct PDF data import - parses extracted text and imports to MongoDB
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const MONGO_URI = 'mongodb+srv://murugannagaraja781_db_user:NewLife2025@cluster0.tp2gekn.mongodb.net/circket';
const Player = require('../models/Player');

// PDF extracted data (already provided)
const PDF_DATA = `BBL 2025-26
Aaron Hardie|Aaron Mark Hardie|1999-01-07|Bournemouth, Dorset|Australia|Yes
Adam Zampa|Adam Zampa|1992-03-31|Shellharbour, New South Wales|Australia|Yes
Babar Azam|Mohammad Babar Azam|1994-10-15|Lahore, Punjab|Pakistan|Yes
Colin Munro|Colin Munro|1987-03-11|Durban|New Zealand|Yes
Cooper Connolly|Cooper Connolly|2003-08-22|Perth|Australia|Yes
David Warner|David Andrew Warner|1986-10-27|Paddington, New South Wales|Australia|Yes
David Willey|David Jonathan Willey|1990-02-28|Northampton|England|Yes
Finn Allen|Finnley Hugh Allen|1999-04-22|Auckland|New Zealand|Yes
Glenn Maxwell|Glenn James Maxwell|1988-10-14|Kew, Melbourne, Victoria|Australia|Yes
Jamie Overton|Jamie Overton|1994-04-10|Barnstaple, Devon|England|Yes
Josh Inglis|Joshua Patrick Inglis|1995-03-04|Leeds, Yorkshire, England|Australia|Yes
Luke Wood|Luke Wood|1995-08-02|Sheffield, Yorkshire|England|Yes
Marnus Labuschagne|Marnus Labuschagne|1994-06-22|Klerksdorp, North West Province, South Africa|Australia|Yes
Matthew Gilkes|Matthew Gilkes|1999-08-21|Ulladulla|Australia|Yes
Matthew Kelly|Matthew Kelly|1994-12-07|Claremont, Western Australia|Australia|Yes
Mitchell Marsh|Mitchell Ross Marsh|1991-10-20|Attadale, Perth|Australia|Yes
Nathan Ellis|Nathan Ellis|1994-09-22|Greenacre, New South Wales|Australia|Yes
Ravichandran Ashwin|Ravichandran Ashwin|1986-09-17|Madras (now Chennai), Tamil Nadu|India|Yes
Reece Topley|Reece James William Topley|1994-02-21|Ipswich, Suffolk|England|Yes
Sam Billings|Samuel William Billings|1991-06-15|Pembury, Kent|England|Yes
Sam Curran|Samuel Matthew Curran|1998-06-03|Northampton|England|Yes
Shadab Khan|Shadab Khan|1998-10-04|Mianwali|Pakistan|Yes
Steve Smith|Steven Peter Devereux Smith|1989-06-02|Sydney, New South Wales|Australia|Yes
Tabraiz Shamsi|Tabraiz Shamsi|1990-02-18|Johannesburg, Gauteng|South Africa|Yes
Tom Curran|Thomas Kevin Curran|1995-03-12|Cape Town, Cape Province|England|Yes
Zaman Khan|Zaman Khan|2001-09-10|Mirpur|Pakistan|Yes

CPL 2026
Akeal Hosein|Akeal Jerome Hosein|1993-04-25|Port-of-Spain|West Indies|Yes
Alex Hales|Alexander Daniel Hales|1989-01-03|Hillingdon, Middlesex|England|Yes
Andre Russell|Andre Dwayne Russell|1988-04-29|Jamaica|West Indies|Yes
Colin Munro|Colin Munro|1987-03-11|Durban|New Zealand|Yes
Dwaine Pretorius|Dwaine Pretorius|1989-03-29|Randfontein|South Africa|Yes
Evin Lewis|Evin Lewis|1991-12-27|Port of Spain, Trinidad|West Indies|Yes
Gudakesh Motie|Gudakesh Motie|1995-03-29|Georgetown, Guyana|West Indies|Yes
Hassan Khan|Mohammad Hassan Khan|1998-10-16|Karachi|Pakistan|Yes
Imran Tahir|Mohammad Imran Tahir|1979-03-27|Lahore, Punjab|South Africa|Yes
Jason Holder|Jason Omar Holder|1991-11-05|Barbados|West Indies|Yes
Jeavor Royal|Jeavor Royal|1998-12-02|Jamaica|West Indies|Yes
Johnson Charles|Johnson Charles|1989-01-14|St Lucia|West Indies|Yes
Joshua Bishop|Joshua Bishop|2000-05-30|Barbados|West Indies|Yes
Kieron Pollard|Kieron Adrian Pollard|1987-05-12|Tacarigua, Trinidad|West Indies|Yes
Moeen Ali|Moeen Munir Ali|1987-06-18|Birmingham|England|Yes
Mujeeb Ur Rahman|Mujeeb Ur Rahman|2001-03-28|Khost|Afghanistan|Yes
Nicholas Pooran|Nicholas Pooran|1995-10-02|Trinidad|West Indies|Yes
Quinton de Kock|Quinton de Kock|1992-12-17|Johannesburg, Gauteng|South Africa|Yes
Romario Shepherd|Romario Shepherd|1994-11-26|Guyana|West Indies|Yes
Rovman Powell|Rovman Powell|1993-07-23|Jamaica|West Indies|Yes
Saim Ayub|Saim Ayub|2002-05-24|Karachi, Pakistan|Pakistan|Yes
Shadab Khan|Shadab Khan|1998-10-04|Mianwali|Pakistan|Yes
Sunil Narine|Sunil Philip Narine|1988-05-26|Arima, Trinidad & Tobago|West Indies|Yes
Waqar Salamkheil|Mohammad Waqar Salamkheil|2001-10-02|Kabul|Afghanistan|Yes

IPL 2026
Abhishek Sharma|Abhishek Sharma|2000-09-04|Amritsar, Punjab|India|Yes
Adam Milne|Adam Fraser Milne|1992-04-13|Palmerston North|New Zealand|Yes
Aiden Markram|Aiden Kyle Markram|1994-10-04|Centurion|South Africa|Yes
Andre Russell|Andre Dwayne Russell|1988-04-29|Jamaica|West Indies|Yes
Arshdeep Singh|Arshdeep Singh|1999-02-05|Guna, Madhya Pradesh|India|Yes
Ayush Badoni|Ayush Badoni|1999-12-03|Delhi|India|Yes
Ben Dwarshuis|Benjamin James Dwarshuis|1994-06-23|Kareela, New South Wales|Australia|Yes
Corbin Bosch|Corbin Bosch|1994-09-10|Durban|South Africa|Yes
Devdutt Padikkal|Devdutt Padikkal|2000-07-07|Edapal, Kerala|India|Yes
Dewald Brevis|Dewald Brevis|2003-04-29|Johannesburg|South Africa|Yes
Dhruv Jurel|Dhruv Chand Jurel|2001-01-21|Agra, Uttar Pradesh|India|Yes
Faf du Plessis|Francois du Plessis|1984-07-13|Pretoria|South Africa|Yes
Hardik Pandya|Hardik Himanshu Pandya|1993-10-11|Choryasi, Gujarat|India|Yes
Harpreet Brar|Harpreet Brar|1995-09-16|Meerut, Uttar Pradesh|India|Yes
Harshit Rana|Harshit Pradeep Rana|2001-12-22|New Delhi|India|Yes
Heinrich Klaasen|Heinrich Klaasen|1991-07-30|Pretoria, Transvaal|South Africa|Yes
Ishan Kishan|Ishan Pranav Kumar Pandey Kishan|1998-07-18|Patna, Bihar|India|Yes
Jasprit Bumrah|Jasprit Jasbirsingh Bumrah|1993-12-06|Ahmedabad|India|Yes
Jos Buttler|Joseph Charles Buttler|1990-09-08|Taunton, Somerset|England|Yes
Kagiso Rabada|Kagiso Rabada|1995-05-25|Johannesburg|South Africa|Yes
Kuldeep Yadav|Kuldeep Yadav|1994-12-14|Kanpur, Uttar Pradesh|India|Yes
M.S. Dhoni|Mahendra Singh Dhoni|1981-07-07|Ranchi, Bihar (now Jharkhand)|India|Yes
Matheesha Pathirana|Matheesha Pathirana|2002-12-18|Kandy|Sri Lanka|Yes
Mayank Markande|Mayank Markande|1997-11-11|Bathinda, Punjab|India|Yes
Mitchell Marsh|Mitchell Ross Marsh|1991-10-20|Attadale, Perth|Australia|Yes
Mohammed Shami|Mohammed Shami Ahmed|1990-09-03|Amroha, Uttar Pradesh|India|Yes
Mohammed Siraj|Mohammed Siraj|1994-03-13|Hyderabad|India|Yes
Mohsin Khan|Mohsin Khan|1998-07-15|Sambhal, Uttar Pradesh|India|Yes
Mukesh Kumar|Mukesh Kumar|1993-10-12|Gopalganj, Bihar|India|Yes
Nicholas Pooran|Nicholas Pooran|1995-10-02|Trinidad|West Indies|Yes
Phil Salt|Philip Dean Salt|1996-08-28|Bodelwyddan, North Wales|England|Yes
Quinton de Kock|Quinton de Kock|1992-12-17|Johannesburg, Gauteng|South Africa|Yes
Rachin Ravindra|Rachin Ravindra|1999-11-18|Wellington|New Zealand|Yes
Rahul Tripathi|Rahul Tripathi|1993-05-20|Sihi, Haryana|India|Yes
Ravi Bishnoi|Ravi Bishnoi|2000-09-05|Jodhpur, Rajasthan|India|Yes
Ravindra Jadeja|Ravindrasinh Anirudhsinh Jadeja|1988-12-06|Navagam-Khed, Saurashtra|India|Yes
Rinku Singh|Rinku Khanchand Singh|1997-10-12|Aligarh, Uttar Pradesh|India|Yes
Rishabh Pant|Rishabh Rajendra Pant|1997-10-04|Haridwar, Uttarakhand|India|Yes
Riyan Parag|Riyan Parag|2001-11-10|Guwahati, Assam|India|Yes
Rohit Sharma|Rohit Gurunath Sharma|1987-04-30|Bansod, Nagpur, Maharashtra|India|Yes
Ruturaj Gaikwad|Ruturaj Dashrat Gaikwad|1997-01-31|Pune, Maharashtra|India|Yes
Sam Curran|Samuel Matthew Curran|1998-06-03|Northampton|England|Yes
Sanju Samson|Sanju Viswanath Samson|1994-11-11|Pulluvila, Vizhinjam, Trivandrum|India|Yes
Shivam Dube|Shivam Dube|1993-06-26|Mumbai|India|Yes
Shreyas Iyer|Shreyas Santosh Iyer|1994-12-06|Mumbai|India|Yes
Shubman Gill|Shubman Gill|1999-09-08|Fazilka, Punjab|India|Yes
Sunil Narine|Sunil Philip Narine|1988-05-26|Arima, Trinidad & Tobago|West Indies|Yes
Suryakumar Yadav|Suryakumar Ashok Yadav|1990-09-14|Mumbai, Maharashtra|India|Yes
T. Natarajan|Thangarasu Natarajan|1991-04-04|Salem|India|Yes
Tilak Varma|Namboori Thakur Tilak Varma|2002-11-08|Hyderabad, Andhra Pradesh|India|Yes
Tim David|Timothy Hays David|1996-03-16|Singapore|Australia|Yes
Tom Banton|Tom Banton|1998-11-11|Chiltern, Buckinghamshire|England|Yes
Virat Kohli|Virat Kohli|1988-11-05|Delhi|India|Yes
Washington Sundar|Washington Sundar|1999-10-05|Chennai, Tamil Nadu|India|Yes
Yash Dayal|Yash Dayal|1997-12-13|Allahabad, Uttar Pradesh|India|Yes
Yash Thakur|Yash Ravisingh Thakur|1998-12-28|Kolkata|India|Yes
Yuzvendra Chahal|Yuzvendra Chahal|Not found|Not found|India|Yes

MLC 2026
Aaron Hardie|Aaron Mark Hardie|1999-01-07|Bournemouth, Dorset|Australia|Yes
Adam Milne|Adam Fraser Milne|1992-04-13|Palmerston North|New Zealand|Yes
Akeal Hosein|Akeal Jerome Hosein|1993-04-25|Port-of-Spain|West Indies|Yes
Ali Khan|Muhammad Ahsan Ali Khan|1990-12-13|Attock, Punjab, Pakistan|United States of America|Yes
Andre Russell|Andre Dwayne Russell|1988-04-29|Jamaica|West Indies|Yes
Ben Dwarshuis|Benjamin James Dwarshuis|1994-06-23|Kareela, New South Wales|Australia|Yes
Carmi le Roux|Carmi le Roux|1993-03-30|Johannesburg, Transvaal|South Africa|Yes
Colin Munro|Colin Munro|1987-03-11|Durban|New Zealand|Yes
Corbin Bosch|Corbin Bosch|1994-09-10|Durban|South Africa|Yes
Donovan Ferreira|Donovan Ferreira|1998-07-21|Pretoria|South Africa|Yes
Faf du Plessis|Francois du Plessis|1984-07-13|Pretoria|South Africa|Yes
Finn Allen|Finnley Hugh Allen|1999-04-22|Auckland|New Zealand|Yes
Glenn Maxwell|Glenn James Maxwell|1988-10-14|Kew, Melbourne, Victoria|Australia|Yes
Harmeet Singh|Harmeet Singh Bansal|1987-10-09|Jodhpur, Rajasthan|India|Yes
Hassan Khan|Mohammad Hassan Khan|1998-10-16|Karachi|Pakistan|Yes
Jasdeep Singh|Jasdeep Singh|1993-02-10|Queens, New York|United States of America|Yes
Jason Holder|Jason Omar Holder|1991-11-05|Barbados|West Indies|Yes
Kieron Pollard|Kieron Adrian Pollard|1987-05-12|Tacarigua, Trinidad|West Indies|Yes
Milind Kumar|Milind Kumar|1991-02-15|Delhi|India|Yes
Nikhil Chaudhary|Nikhil Chaudhary|1996-05-04|Delhi|India|Yes
Ottneil Baartman|Ottniel Emile Graham Baartman|1993-03-18|Oudtshoorn, West. Cape|South Africa|Yes
Quinton de Kock|Quinton de Kock|1992-12-17|Johannesburg, Gauteng|South Africa|Yes
Ravichandran Ashwin|Ravichandran Ashwin|1986-09-17|Madras (now Chennai), Tamil Nadu|India|Yes
Romario Shepherd|Romario Shepherd|1994-11-26|Guyana|West Indies|Yes
Rushil Ugarkar|Rushil Jayraj Ugarkar|2003-06-30|United States of America|Partial|Yes
Saurabh Netravalkar|Saurabh Netravalkar|Not found|Not found|United States of America|Yes
Shubham Ranjane|Shubham Subhash Ranjane|1994-03-26|Pune, Maharashtra|India|Yes
Steve Smith|Steven Peter Devereux Smith|1989-06-02|Sydney, New South Wales|Australia|Yes
Sunil Narine|Sunil Philip Narine|1988-05-26|Arima, Trinidad & Tobago|West Indies|Yes
Tim David|Timothy Hays David|1996-03-16|Singapore|Australia|Yes
Yasir Mohammad|Yasir Saeed Mohammad|2002-10-10|Edison, New Jersey|United States of America|Yes
Zia-ul-Haq|Zia-ul-Haq|1994-12-11|Vehari, Punjab|Pakistan|Yes

PSL 2026
Akeal Hosein|Akeal Jerome Hosein|1993-04-25|Port-of-Spain|West Indies|Yes
Andre Russell|Andre Dwayne Russell|1988-04-29|Jamaica|West Indies|Yes
Colin Munro|Colin Munro|1987-03-11|Durban|New Zealand|Yes
David Warner|David Andrew Warner|1986-10-27|Paddington, New South Wales|Australia|Yes
Finn Allen|Finnley Hugh Allen|1999-04-22|Auckland|New Zealand|Yes
Glenn Maxwell|Glenn James Maxwell|1988-10-14|Kew, Melbourne, Victoria|Australia|Yes
Imad Wasim|Syed Imad Wasim|1988-12-18|Swansea, Glamorgan, Wales|Pakistan|Yes
Jason Holder|Jason Omar Holder|1991-11-05|Barbados|West Indies|Yes
Jos Buttler|Joseph Charles Buttler|1990-09-08|Taunton, Somerset|England|Yes
Moeen Ali|Moeen Munir Ali|1987-06-18|Birmingham|England|Yes
Mohammad Amir|Mohammad Amir|1992-04-13|Gujjar Khan, Punjab|Pakistan|Yes
Mohammad Nabi|Mohammad Nabi|1985-01-01|Loger, Afghanistan|Afghanistan|Yes
Mohammad Nawaz|Mohammad Nawaz|1994-03-21|Rawalpindi, Punjab|Pakistan|Yes
Mohammad Rizwan|Mohammad Rizwan|1992-06-01|Peshawar, Khyber Pakhtunkhwa|Pakistan|Yes
Mujeeb Ur Rahman|Mujeeb Ur Rahman|2001-03-28|Khost|Afghanistan|Yes
Quinton de Kock|Quinton de Kock|1992-12-17|Johannesburg, Gauteng|South Africa|Yes
Rashid Khan|Rashid Khan Arman|1998-09-20|Nangarhar|Afghanistan|Yes
Saud Shakeel|Saud Shakeel|1995-09-05|Karachi, Sind|Pakistan|Yes
Shadab Khan|Shadab Khan|1998-10-04|Mianwali|Pakistan|Yes
Shahnawaz Dahani|Shahnawaz Dahani|1998-08-05|Larkana|Pakistan|Yes
Shaheen Shah Afridi|Shaheen Shah Afridi|2000-04-06|Khyber Agency|Pakistan|Yes
Shan Masood|Shan Masood Khan|1989-10-14|Kuwait|Pakistan|Yes
Sikandar Raza|Sikandar Raza Butt|1986-04-24|Sialkot, Punjab, Pakistan|Zimbabwe|Yes
Steve Smith|Steven Peter Devereux Smith|1989-06-02|Sydney, New South Wales|Australia|Yes
Tabraiz Shamsi|Tabraiz Shamsi|1990-02-18|Johannesburg, Gauteng|South Africa|Yes
Tom Curran|Thomas Kevin Curran|1995-03-12|Cape Town, Cape Province|England|Yes
Usman Khan|Usman Riaz Khan|1990-10-06|France|Partial|Yes
Usman Khawaja|Usman Khawaja|Not found|Not found|Australia|Yes

SA20 2025-26
Aiden Markram|Aiden Kyle Markram|1994-10-04|Centurion|South Africa|Yes
Andre Russell|Andre Dwayne Russell|1988-04-29|Jamaica|West Indies|Yes
Corbin Bosch|Corbin Bosch|1994-09-10|Durban|South Africa|Yes
David Wiese|David Wiese|1985-05-18|Roodepoort|Namibia|Yes
Dayyaan Galiem|Abdu Dayyaan Galiem|1997-01-02|Cape Town, Cape Province|South Africa|Yes
Donovan Ferreira|Donovan Ferreira|1998-07-21|Pretoria|South Africa|Yes
Dwaine Pretorius|Dwaine Pretorius|1989-03-29|Randfontein|South Africa|Yes
Eathan Bosch|Eathan Bosch|1998-04-27|Westville|South Africa|Yes
Evan Jones|Evan Jones|1996-08-05|Pretoria|South Africa|Yes
Faf du Plessis|Francois du Plessis|1984-07-13|Pretoria|South Africa|Yes
Heinrich Klaasen|Heinrich Klaasen|1991-07-30|Pretoria, Transvaal|South Africa|Yes
Imran Tahir|Mohammad Imran Tahir|1979-03-27|Lahore, Punjab|South Africa|Yes
James Vince|James Michael Vince|1991-03-14|Cuckfield, Sussex|England|Yes
Jos Buttler|Joseph Charles Buttler|1990-09-08|Taunton, Somerset|England|Yes
Kagiso Rabada|Kagiso Rabada|1995-05-25|Johannesburg|South Africa|Yes
Karim Janat|Karim Janat|1998-08-11|Kabul|Afghanistan|Yes
Lewis Gregory|Lewis Gregory|1992-05-24|Plymouth|England|Yes
Mitchell Van Buuren|Mitchell Van Buuren|1998-01-21|Gauteng|South Africa|Yes
Mujeeb Ur Rahman|Mujeeb Ur Rahman|2001-03-28|Khost|Afghanistan|Yes
Nandre Burger|Nandre Burger|1995-08-11|Krugersdorp|South Africa|Yes
Nicholas Pooran|Nicholas Pooran|1995-10-02|Trinidad|West Indies|Yes
Prenelan Subrayen|Prenelan Subrayen|1993-09-23|Tongaat, Durban|South Africa|Yes
Quinton de Kock|Quinton de Kock|1992-12-17|Johannesburg, Gauteng|South Africa|Yes
Rashid Khan|Rashid Khan Arman|1998-09-20|Nangarhar|Afghanistan|Yes
Reece Topley|Reece James William Topley|1994-02-21|Ipswich, Suffolk|England|Yes
Senuran Muthusamy|Senuran Muthusamy|1994-02-22|Durban|South Africa|Yes
Shubham Ranjane|Shubham Subhash Ranjane|1994-03-26|Pune, Maharashtra|India|Yes
Sikandar Raza|Sikandar Raza Butt|1986-04-24|Sialkot, Punjab, Pakistan|Zimbabwe|Yes
Sunil Narine|Sunil Philip Narine|1988-05-26|Arima, Trinidad & Tobago|West Indies|Yes
Tabraiz Shamsi|Tabraiz Shamsi|1990-02-18|Johannesburg, Gauteng|South Africa|Yes
Taijul Islam|Taijul Islam|1992-02-07|Natore|Bangladesh|Yes

The Hundred 2026
Adam Milne|Adam Fraser Milne|1992-04-13|Palmerston North|New Zealand|Yes
Adam Zampa|Adam Zampa|1992-03-31|Shellharbour, New South Wales|Australia|Yes
Craig Overton|Craig Overton|1994-04-10|Barnstaple, Devon|England|Yes
David Willey|David Jonathan Willey|1990-02-28|Northampton|England|Yes
Dillon Pennington|Dillon Pennington|1999-02-26|Shrewsbury, Shropshire|England|Yes
Donovan Ferreira|Donovan Ferreira|1998-07-21|Pretoria|South Africa|Yes
Finn Allen|Finnley Hugh Allen|1999-04-22|Auckland|New Zealand|Yes
Heinrich Klaasen|Heinrich Klaasen|1991-07-30|Pretoria, Transvaal|South Africa|Yes
Jamie Overton|Jamie Overton|1994-04-10|Barnstaple, Devon|England|Yes
James Vince|James Michael Vince|1991-03-14|Cuckfield, Sussex|England|Yes
Jordan Clark|Jordan Clark|1990-10-14|Whitehaven, Cumbria|England|Yes
Jos Buttler|Joseph Charles Buttler|1990-09-08|Taunton, Somerset|England|Yes
Josh Tongue|Josh Tongue|Not found|Not found|England|Yes
Lewis Gregory|Lewis Gregory|1992-05-24|Plymouth|England|Yes
Luke Wood|Luke Wood|1995-08-02|Sheffield, Yorkshire|England|Yes
Mitchell Marsh|Mitchell Ross Marsh|1991-10-20|Attadale, Perth|Australia|Yes
Mustafizur Rahman|Mustafizur Rahman|1995-09-06|Satkhira|Bangladesh|Yes
Nathan Ellis|Nathan Ellis|1994-09-22|Greenacre, New South Wales|Australia|Yes
Nicholas Pooran|Nicholas Pooran|1995-10-02|Trinidad|West Indies|Yes
Phil Salt|Philip Dean Salt|1996-08-28|Bodelwyddan, North Wales|England|Yes
Rachin Ravindra|Rachin Ravindra|1999-11-18|Wellington|New Zealand|Yes
Rashid Khan|Rashid Khan Arman|1998-09-20|Nangarhar|Afghanistan|Yes
Reece Topley|Reece James William Topley|1994-02-21|Ipswich, Suffolk|England|Yes
Rehan Ahmed|Rehan Ahmed|2004-08-13|Nottingham|England|Yes
Saqib Mahmood|Saqib Mahmood|1997-02-25|Birmingham, Warwickshire|England|Yes
Sam Billings|Samuel William Billings|1991-06-15|Pembury, Kent|England|Yes
Sam Curran|Samuel Matthew Curran|1998-06-03|Northampton|England|Yes
Sonny Baker|Sonny Baker|2003-03-13|Torbay, Devon|England|Yes
Tim David|Timothy Hays David|1996-03-16|Singapore|Australia|Yes
Tom Banton|Tom Banton|1998-11-11|Chiltern, Buckinghamshire|England|Yes
Tom Curran|Thomas Kevin Curran|1995-03-12|Cape Town, Cape Province|England|Yes
Tom Kohler-Cadmore|Tom Kohler-Cadmore|1994-08-19|Chatham, Kent|England|Yes
Zak Crawley|Zak Crawley|1998-02-03|Bromley, Kent|England|Yes

BPL 2025-26
Abdullah Al Mamun|Abdullah Al Mamun|2003-11-25|Rangpur|Bangladesh|Yes
Afif Hossain|Afif Hossain Dhrubo|1999-09-22|Khulna|Bangladesh|Yes
Akif Javed|Akif Javed|2000-10-10|Kohat|Pakistan|Yes
Asif Ali|Asif Ali|1991-10-01|Faisalabad, Punjab|Pakistan|Yes
Binura Fernando|Binura Fernando|1995-07-12|Colombo|Sri Lanka|Yes
Ebadot Hossain|Ebadot Hossain|Not found|Not found|Bangladesh|Yes
Faheem Ashraf|Faheem Ashraf|1994-01-16|Kasur (Punjab)|Pakistan|Yes
Hasan Mahmud|Hasan Mahmud|1999-10-12|Laxmipur|Bangladesh|Yes
Hasan Murad|Hasan Murad|2001-07-01|Cox's Bazar|Bangladesh|Yes
Hazratullah Zazai|Hazratullah Zazai|1998-03-23|Paktia|Afghanistan|Yes
Hussain Talat|Mohammad Hussain Talat|1996-02-12|Lahore, Punjab|Pakistan|Yes
Iftikhar Ahmed|Iftikhar Ahmed|1968-03-31|Karachi, Sind|Pakistan|Yes
Imad Wasim|Syed Imad Wasim|1988-12-18|Swansea, Glamorgan, Wales|Pakistan|Yes
Irfan Sukkur|Irfan Sukkur|1993-05-22|Chittagong|Bangladesh|Yes
Johnson Charles|Johnson Charles|1989-01-14|St Lucia|West Indies|Yes
Khaled Ahmed|Syed Khaled Ahmed|1992-09-20|Sylhet|Bangladesh|Yes
Khushdil Shah|Khushdil Shah|1995-02-07|Bannu, North-West Frontier Province|Pakistan|Yes
Mahidul Islam Ankon|Mahidul Islam Bhuiyan Ankon|1999-05-04|Comilla|Bangladesh|Yes
Mahmudullah|Mohammad Mahmudullah|1986-02-04|Mymensingh|Bangladesh|Yes
Milind Kumar|Milind Kumar|1991-02-15|Delhi|India|Yes
Mohammad Nabi|Mohammad Nabi|1985-01-01|Loger, Afghanistan|Afghanistan|Yes
Mohammad Naim|Mohammad Naim Sheikh|1999-08-22|Dhaka South|Bangladesh|Yes
Mohammad Nawaz|Mohammad Nawaz|1994-03-21|Rawalpindi, Punjab|Pakistan|Yes
Mohammad Saifuddin|Mohammad Saifuddin|1996-11-01|Feni, Chittagong|Bangladesh|Yes
Mominul Haque|Mominul Haque|1991-09-29|Cox's Bazar|Bangladesh|Yes
Mushfiqur Rahim|Mohammad Mushfiqur Rahim|1987-05-09|Bogra|Bangladesh|Yes
Mustafizur Rahman|Mustafizur Rahman|1995-09-06|Satkhira|Bangladesh|Yes
Nahid Rana|Nahid Rana|2002-10-02|Chapai Nawabgonj|Bangladesh|Yes
Nayeem Hasan|Mohammad Nayeem Hasan|2000-02-12|Chittagong|Bangladesh|Yes
Nazmul Islam|Mohammad Nazmul Islam|1992-03-21|Dhaka|Bangladesh|Yes
Rahmanullah Gurbaz|Rahmanullah Gurbaz|2001-11-28|Afghanistan|Partial|Yes
Rony Talukdar|Rony Talukdar|1990-10-10|Narayangonj|Bangladesh|Yes
Ruyel Miah|MD Ruyel Miah|2000-12-16|Moulavi Bazar|Bangladesh|Yes
Sabbir Rahman|Mohammad Sabbir Rahman|1991-11-22|Rajsahi|Bangladesh|Yes
Sahibzada Farhan|Sahibzada Farhan|1996-03-06|Charsadda|Pakistan|Yes
Saim Ayub|Saim Ayub|2002-05-24|Karachi, Pakistan|Pakistan|Yes
Salman Hossain|Mohammad Salman Hossain Emon|1995-06-18|Barisal|Bangladesh|Yes
Salman Mirza|Mohammad Salman Mirza|1994-01-01|Lahore|Pakistan|Yes
Sandeep Lamichhane|Sandeep Lamichhane|2000-08-02|Syangja|Nepal|Yes
Shadman Islam|Shadman Islam Anik|1995-05-18|Dhaka|Bangladesh|Yes
Shamim Hossain|Shamim Hossain Patwari|2000-09-02|Chandpur|Bangladesh|Yes
Shohidul Islam|MD Shohidul Islam|1995-01-05|Narayanganj|Bangladesh|Yes
Shoriful Islam|Mohammad Shoriful Islam|2001-06-03|Panchagor|Bangladesh|Yes
Shuvagata Hom|Shuvagata Hom Chowdhury|1986-11-11|Mymensing|Bangladesh|Yes
Soumya Sarkar|Soumya Sarkar|1993-02-25|Satkhira|Bangladesh|Yes
Sumon Khan|Sumon Khan|2000-01-13|Manikgonj|Bangladesh|Yes
Taijul Islam|Taijul Islam|1992-02-07|Natore|Bangladesh|Yes
Tanvir Islam|Tanvir Islam|1996-10-25|Barisal|Bangladesh|Yes
Tanzid Hasan|Tanzid Hasan Tamim|2000-12-01|Bogra|Bangladesh|Yes
Tanzim Hasan Sakib|Tanzim Hasan Sakib|2002-10-20|Sylhet|Bangladesh|Yes
Taskin Ahmed|Taskin Ahmed|1995-04-03|Dhaka|Bangladesh|Yes
Tawfique Khan Tushar|Tawfique Khan Tushar|1991-06-12|Sylhet|Bangladesh|Yes
Yasir Ali|Yasir Ali|1985-10-15|Hazro, Attock|Pakistan|Yes
Zahiduzzaman|Zahiduzzaman|1996-07-03|Pirojpur|Bangladesh|Yes
Zakir Hasan|Mohammad Zakir Hasan|1998-02-01|Bangladesh|Bangladesh|Yes
Ziaur Rahman|Ziaur Rahman|1998-10-17|Khost|Afghanistan|Yes`;

// Parse the embedded data
function parseData(raw) {
 const players = [];
 const lines = raw.split('\n');

 for (const line of lines) {
 const trimmed = line.trim();
 if (!trimmed) continue;

 // Detect league
 let league = '';
 if (trimmed === 'BBL 2025-26') { league = 'BBL'; continue; }
 if (trimmed === 'BPL 2025-26') { league = 'BPL'; continue; }
 if (trimmed === 'CPL 2026') { league = 'CPL'; continue; }
 if (trimmed === 'IPL 2026') { league = 'IPL'; continue; }
 if (trimmed === 'MLC 2026') { league = 'MLC'; continue; }
 if (trimmed === 'PSL 2026') { league = 'PSL'; continue; }
 if (trimmed === 'SA20 2025-26') { league = 'SA20'; continue; }
 if (trimmed === 'The Hundred 2026') { league = 'The Hundred'; continue; }

 // Skip headers
 if (trimmed.includes('Roster name') || trimmed.includes('Matched player') ||
 trimmed.includes('DOB') && trimmed.includes('Birth place')) continue;

 // Parse player row
 const parts = trimmed.split('|').map(s => s.trim());
 if (parts.length >= 4 && parts[0]) {
 const rosterName = parts[0];
 const matchedName = parts[1] || rosterName;
 const dob = parts[2] === 'Not found' ? '' : parts[2];
 const birthPlace = parts[3] === 'Not found' ? '' : parts[3];
 const country = parts[4] === 'Not found' ? '' : parts[4];

 players.push({
 league,
 rosterName,
 matchedName,
 dob,
 birthPlace,
 country
 });
 }
 }

 return players;
}

// MAIN
async function main() {
 console.log('=== Import PDF Players to MongoDB ===\n');

 const players = parseData(PDF_DATA);
 console.log(`Parsed ${players.length} players from PDF\n`);

 await mongoose.connect(MONGO_URI);
 console.log('Connected to MongoDB\n');

 const existing = await Player.find({}).lean();
 const existingMap = new Map();
 existing.forEach(p => existingMap.set(p.name.toLowerCase().trim(), p));
 console.log(`Existing DB players: ${existing.length}\n`);

 let added = 0, updated = 0, skipped = 0;

 for (const p of players) {
 const name = p.rosterName.trim();
 const nameLower = name.toLowerCase();
 const existingPlayer = existingMap.get(nameLower);

 if (existingPlayer) {
 const updates = {};
 if (p.dob && !existingPlayer.dob) updates.dob = p.dob;
 if (p.birthPlace && !existingPlayer.birthPlace) updates.birthPlace = p.birthPlace;
 if (p.country && !existingPlayer.birthPlace) updates.birthPlace = p.country;

 if (Object.keys(updates).length > 0) {
 await Player.findByIdAndUpdate(existingPlayer._id, { $set: updates });
 updated++;
 console.log(` Updated: ${name} | DOB: ${updates.dob || '-'} | Place: ${updates.birthPlace || '-'}`);
 } else {
 skipped++;
 }
 } else {
 const newPlayer = {
 id: Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 8),
 name,
 profile: '',
 dob: p.dob || '',
 birthTime: '09:00',
 birthPlace: p.birthPlace || p.country || '',
 latitude: 13.0827,
 longitude: 80.2707,
 timezone: 5.5,
 role: 'BAT',
 gender: '',
 league: p.league,
 manualStatus: ''
 };
 await Player.create(newPlayer);
 added++;
 existingMap.set(nameLower, newPlayer);
 }
 }

 console.log('\n=== Import Complete ===');
 console.log(` Added: ${added}`);
 console.log(` Updated: ${updated}`);
 console.log(` Skipped (already have all data): ${skipped}`);
 console.log(`\nTotal in DB: ${await Player.countDocuments()}`);

 // League breakdown
 const all = await Player.find({}).lean();
 const leagueStats = {};
 all.forEach(p => {
 const l = p.league || 'Unknown';
 leagueStats[l] = (leagueStats[l] || 0) + 1;
 });
 console.log('\nLeague breakdown:');
 Object.entries(leagueStats).sort((a,b) => b[1] - a[1]).forEach(([l,c]) => console.log(` ${l}: ${c}`));

 console.log(`\nWith DOB: ${all.filter(p => p.dob).length}`);
 console.log(`With Birth Place: ${all.filter(p => p.birthPlace).length}`);

 await mongoose.disconnect();
 process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
