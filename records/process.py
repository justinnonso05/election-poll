import csv
import os

def main():
    records_dir = os.path.dirname(os.path.abspath(__file__))
    input_file = os.path.join(records_dir, 'combined.csv')
    
    if not os.path.exists(input_file):
        print(f"Error: {input_file} not found.")
        return

    # Dictionary to hold the data for each level
    level_data = {}
    
    # Mapping old headers to new headers
    header_mapping = {
        'First Name': 'first_name',
        'Last Name': 'last_name',
        'Email Address (Ensure its a working email. Preferably a personal mail, not student email)': 'email',
        'Level': 'level',
        'Matric No': 'studentId'
    }
    
    new_headers = list(header_mapping.values())
    
    print(f"Reading {input_file}...")
    with open(input_file, mode='r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        
        for row in reader:
            level_val = str(row.get('Level', '')).strip()
            
            # Create a new row mapped to new headers
            new_row = {}
            for old_h, new_h in header_mapping.items():
                new_row[new_h] = row.get(old_h, '')
            
            if level_val not in level_data:
                level_data[level_val] = []
                
            level_data[level_val].append(new_row)

    # Write out to individual level CSVs
    for level, rows in level_data.items():
        if not level:
            print("Warning: Found rows with no level specified. Skipping...")
            continue
            
        output_filename = f"{level}_1.csv"
        output_filepath = os.path.join(records_dir, output_filename)
        
        print(f"Writing {len(rows)} records to {output_filename}...")
        with open(output_filepath, mode='w', encoding='utf-8', newline='') as out_f:
            writer = csv.DictWriter(out_f, fieldnames=new_headers)
            writer.writeheader()
            writer.writerows(rows)
            
    print("Processing complete!")

if __name__ == "__main__":
    main()
