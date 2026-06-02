import csv
import os

def find_key(row, keywords):
    if isinstance(keywords, str):
        keywords = [keywords]
    for kw in keywords:
        for k in row.keys():
            if k and kw.lower() in k.lower():
                return str(row[k]).strip()
    return ''

def main():
    records_dir = os.path.dirname(os.path.abspath(__file__))
    levels = ['200', '300', '400', '500']
    
    new_headers = ['first_name', 'last_name', 'email', 'level', 'studentId']

    for level in levels:
        old_file = os.path.join(records_dir, f"{level}.csv")
        new_file = os.path.join(records_dir, f"{level}_1.csv")
        
        if not os.path.exists(old_file) or not os.path.exists(new_file):
            print(f"Skipping level {level} because files are missing.")
            continue

        print(f"\nProcessing Level {level}...")
        
        old_records = {}
        new_records = {}
        
        # Load OLD file
        with open(old_file, mode='r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                matric = find_key(row, ['matric'])
                if not matric:
                    continue
                # Map old headers to new headers
                old_records[matric] = {
                    'first_name': find_key(row, ['first', 'other']),
                    'last_name': find_key(row, ['last', 'surname']),
                    'email': find_key(row, ['email']),
                    'level': level,
                    'studentId': matric
                }

        # Load NEW file
        with open(new_file, mode='r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                matric = str(row.get('studentId', '')).strip()
                if not matric:
                    continue
                new_records[matric] = row

        final_records = []
        new_only_records = []

        # 1. Base on OLD records. Update from NEW if matric exists
        for matric, old_row in old_records.items():
            if matric in new_records:
                final_records.append(new_records[matric])
            else:
                final_records.append(old_row)

        # 2. Check for records in NEW but NOT in OLD
        for matric, new_row in new_records.items():
            if matric not in old_records:
                new_only_records.append(new_row)

        # Write final merged CSV
        merged_file = os.path.join(records_dir, f"{level}_merged.csv")
        with open(merged_file, mode='w', encoding='utf-8', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=new_headers)
            writer.writeheader()
            writer.writerows(final_records)
        print(f" -> Wrote {len(final_records)} records to {level}_merged.csv")

        # Write new-only CSV
        new_only_file = os.path.join(records_dir, f"{level}_new_only.csv")
        with open(new_only_file, mode='w', encoding='utf-8', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=new_headers)
            writer.writeheader()
            writer.writerows(new_only_records)
        print(f" -> Wrote {len(new_only_records)} records to {level}_new_only.csv")

if __name__ == "__main__":
    main()
