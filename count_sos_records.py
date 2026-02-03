import csv
import random
import shutil
from datetime import datetime

def filter_sos_records(csv_file_path, target_sos_count=250):
    """
    Randomly remove SOS records to keep only the target count (250 by default)
    while preserving all non-SOS records.
    
    Args:
        csv_file_path: Path to the CSV file
        target_sos_count: Number of SOS records to keep (default: 250)
    """
    # Create backup of original file
    backup_path = csv_file_path.replace('.csv', f'_backup_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv')
    shutil.copy2(csv_file_path, backup_path)
    print(f"[OK] Backup created: {backup_path}")
    
    sos_records = []
    non_sos_records = []
    header = None
    
    # Read all records and separate SOS from non-SOS
    try:
        with open(csv_file_path, 'r', encoding='utf-8') as file:
            csv_reader = csv.DictReader(file)
            header = csv_reader.fieldnames
            
            for row in csv_reader:
                matric_no = row.get('Matric No', '').strip()
                
                if matric_no.lower().startswith('sos'):
                    sos_records.append(row)
                else:
                    non_sos_records.append(row)
        
        print(f"\n[STATS] Original Statistics:")
        print(f"   Total records: {len(sos_records) + len(non_sos_records)}")
        print(f"   SOS records: {len(sos_records)}")
        print(f"   Non-SOS records: {len(non_sos_records)}")
        
        # Randomly select target_sos_count SOS records
        if len(sos_records) > target_sos_count:
            selected_sos_records = random.sample(sos_records, target_sos_count)
            removed_count = len(sos_records) - target_sos_count
            print(f"\n[ACTION] Randomly removing {removed_count} SOS records...")
        else:
            selected_sos_records = sos_records
            print(f"\n[WARNING] Current SOS count ({len(sos_records)}) is already at or below target ({target_sos_count})")
        
        # Combine selected SOS records with all non-SOS records
        final_records = non_sos_records + selected_sos_records
        
        # Write to new file
        output_path = csv_file_path.replace('.csv', '_filtered.csv')
        with open(output_path, 'w', newline='', encoding='utf-8') as file:
            writer = csv.DictWriter(file, fieldnames=header)
            writer.writeheader()
            writer.writerows(final_records)
        
        print(f"\n[OK] Filtered file created: {output_path}")
        print(f"\n[STATS] New Statistics:")
        print(f"   Total records: {len(final_records)}")
        print(f"   SOS records: {len(selected_sos_records)}")
        print(f"   Non-SOS records: {len(non_sos_records)}")
        print(f"   Percentage of SOS: {(len(selected_sos_records)/len(final_records)*100):.2f}%")
        
        # Ask if user wants to replace original file
        print(f"\n[INFO] To replace the original file, run:")
        print(f"   move /Y \"{output_path}\" \"{csv_file_path}\"")
        
    except FileNotFoundError:
        print(f"[ERROR] File not found at {csv_file_path}")
    except Exception as e:
        print(f"[ERROR] Error processing file: {str(e)}")

if __name__ == "__main__":
    csv_file = r"c:\Projects\election-poll\cleaned_NAOSS_3.csv"
    filter_sos_records(csv_file, target_sos_count=250)
