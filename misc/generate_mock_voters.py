import csv
import random

def generate_mock_voters(filename="mock_voters_100.csv", count=100):
    first_names = [
        "Ade", "Bolu", "Chinedu", "David", "Emeka", "Femi", "Grace", "Hassan", 
        "Ibrahim", "Joy", "Kehinde", "Latifat", "Maryam", "Ngozi", "Olamide", 
        "Praise", "Qudus", "Rukayat", "Samuel", "Taiwo", "Uche", "Victor", 
        "Wale", "Xavier", "Yusuf", "Zainab", "Abigial", "Bunmi", "Chioma", 
        "Damilola", "Esther", "Folake", "Gbenga", "Habib", "Idris", "John", 
        "Kemi", "Lukman", "Musa", "Nifemi", "Opemipo", "Peter", "Queen", 
        "Ridwan", "Segun", "Temitope", "Usman", "Victoria", "Wumi", "Yinka"
    ]
    
    last_names = [
        "Adebayo", "Balogun", "Chukwu", "Daniel", "Eze", "Fashola", "Gbadamosi", 
        "Hassan", "Ige", "Johnson", "Kalu", "Lawal", "Mohammed", "Nwachukwu", 
        "Ojo", "Popoola", "Quadri", "Raji", "Sanni", "Thomas", "Umar", "Vincent", 
        "Williams", "Yakubu", "Zakari", "Adeleke", "Bankole", "Coker", "Dada", 
        "Eniola", "Falana", "George", "Hamzat", "Idowu", "Jegede", "Kolawole", 
        "Lamidi", "Mustapha", "Nweke", "Ogunleye", "Phillips", "Salami", 
        "Taiwo", "Udeh", "Vaughan", "Wahab", "Yusuf", "Zacheus"
    ]
    
    departments = ["CSC", "ECO", "ACC", "BUS", "MCB", "BCH", "PHY", "CHM", "MAT", "STA"]
    levels = ["100", "200", "300", "400"]
    
    voters = []
    generated_emails = set()
    generated_matrics = set()
    
    for i in range(1, count + 1):
        f_name = random.choice(first_names)
        l_name = random.choice(last_names)
        
        # Generate Unique Matric No
        # Format: DEPT/YEAR/YEAR+1/XXXX
        dept = random.choice(departments)
        year_prefix = random.choice(["21/22", "22/23", "23/24", "24/25"])
        serial = f"{i:04d}" # 0001, 0002, etc.
        matric_no = f"{dept}/{year_prefix}/{serial}"
        
        # Ensure matric is unique (it should be by serial logic, but just in case of random collision if logic changes)
        while matric_no in generated_matrics:
            serial = f"{random.randint(count+1, 9999):04d}"
            matric_no = f"{dept}/{year_prefix}/{serial}"
        generated_matrics.add(matric_no)
        
        # Generate Unique Email
        base_email = f"{f_name.lower()}.{l_name.lower()}{i}@example.com"
        email = base_email
        e_counter = 1
        while email in generated_emails:
            email = f"{f_name.lower()}.{l_name.lower()}{i}_{e_counter}@example.com"
            e_counter += 1
        generated_emails.add(email)
        
        level = random.choice(levels)
        
        voters.append({
            "first_name": f_name,
            "last_name": l_name,
            "email": email,
            "level": level,
            "Matric No": matric_no
        })
        
    # Write to CSV
    fieldnames = ['first_name', 'last_name', 'email', 'level', 'Matric No']
    
    try:
        with open(filename, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(voters)
            print(f"[OK] Successfully generated {count} mock voters in '{filename}'")
            
            # Preview first 3
            print("\nPreview first 3 rows:")
            for v in voters[:3]:
                print(f"{v['first_name']} {v['last_name']} | {v['email']} | {v['level']} | {v['Matric No']}")
                
    except Exception as e:
        print(f"[ERROR] Error generating CSV: {e}")

if __name__ == "__main__":
    generate_mock_voters(r"c:\Projects\election-poll\mock_voters_100.csv", 100)
