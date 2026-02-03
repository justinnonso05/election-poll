import csv
import shutil
from datetime import datetime

def prepare_voters_csv(input_file, output_file=None):
    """
    Transform the CSV to match voter upload requirements.
    Required fields: first_name, last_name, email, level, studentId
    
    Args:
        input_file: Path to the input CSV file
        output_file: Path to the output CSV file (optional)
    """
    if output_file is None:
        output_file = input_file.replace('.csv', '_voters_ready.csv')
    
    # Create backup
    backup_path = input_file.replace('.csv', f'_backup_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv')
    shutil.copy2(input_file, backup_path)
    print(f"[OK] Backup created: {backup_path}")
    
    voters_data = []
    skipped_count = 0
    
    try:
        with open(input_file, 'r', encoding='utf-8') as file:
            csv_reader = csv.DictReader(file)
            
            for row in csv_reader:
                # Extract first name and last name from "First Name" and "Last Name" columns
                first_name = row.get('First Name', '').strip()
                last_name = row.get('Last Name', '').strip()
                
                # Use Username as email (or create email from matric number if needed)
                email = row.get('Username', '').strip().lower()
                
                # Extract matric number
                matric_no = row.get('Matric No', '').strip()
                
                # Determine level from matric number (e.g., SOS/24/25/0861 -> 100 level for 24/25)
                # Extract the year part from matric number
                level = ''
                if matric_no:
                    parts = matric_no.split('/')
                    if len(parts) >= 3:
                        year_part = parts[1]  # e.g., "24" from "SOS/24/25/0861"
                        try:
                            year = int(year_part)
                            # Calculate level based on year
                            # 24/25 = 100 level, 23/24 = 200 level, etc.
                            current_year = 25  # Assuming current academic year is 25/26
                            years_in_school = current_year - year
                            level_num = (years_in_school * 100) + 100
                            level = f"{level_num}"
                        except ValueError:
                            level = "100"  # Default to 100 level if can't parse
                
                # Skip rows with missing critical data
                if not first_name or not last_name or not matric_no:
                    skipped_count += 1
                    continue
                
                # If no email, generate one from matric number
                if not email:
                    email = f"{matric_no.replace('/', '_').lower()}@student.edu"
                
                voters_data.append({
                    'first_name': first_name,
                    'last_name': last_name,
                    'email': email,
                    'level': level,
                    'Matric No': matric_no
                })
        
        # Write to output file
        if voters_data:
            with open(output_file, 'w', newline='', encoding='utf-8') as file:
                fieldnames = ['first_name', 'last_name', 'email', 'level', 'Matric No']
                writer = csv.DictWriter(file, fieldnames=fieldnames)
                writer.writeheader()
                writer.writerows(voters_data)
            
            print(f"\n[OK] Voters CSV created: {output_file}")
            print(f"\n[STATS] Statistics:")
            print(f"   Total voters processed: {len(voters_data)}")
            print(f"   Skipped (missing data): {skipped_count}")
            print(f"\n[INFO] Columns included:")
            print(f"   - first_name")
            print(f"   - last_name")
            print(f"   - email")
            print(f"   - level")
            print(f"   - Matric No")
            
            # Show sample of first 3 rows
            print(f"\n[PREVIEW] First 3 rows:")
            for i, voter in enumerate(voters_data[:3], 1):
                print(f"   {i}. {voter['first_name']} {voter['last_name']} | {voter['email']} | Level {voter['level']} | {voter['Matric No']}")
        else:
            print("[ERROR] No valid voter data found in the file")
            
    except FileNotFoundError:
        print(f"[ERROR] File not found at {input_file}")
    except Exception as e:
        print(f"[ERROR] Error processing file: {str(e)}")

if __name__ == "__main__":
    # Use the filtered CSV file
    input_csv = r"c:\Projects\election-poll\cleaned_NAOSS_3_filtered.csv"
    prepare_voters_csv(input_csv)
