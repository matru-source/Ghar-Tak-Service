import os
import zipfile

def create_deploy_zip():
    zip_path = 'd:/ZEX/Ghar tak/GTS_UPDATE.zip'
    base_dir = 'd:/ZEX/Ghar tak/web'
    
    if os.path.exists(zip_path):
        os.remove(zip_path)
        
    print(f"Creating {zip_path}...")
    
    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(base_dir):
            # Skip node_modules and .next/cache
            if 'node_modules' in root.split(os.sep):
                continue
            if '.next' in root.split(os.sep) and 'cache' in root.split(os.sep):
                continue
            if '.git' in root.split(os.sep):
                continue
                
            for file in files:
                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, base_dir)
                zipf.write(full_path, rel_path)
                
    file_size_mb = os.path.getsize(zip_path) / (1024 * 1024)
    print(f"Zip created successfully: {file_size_mb:.2f} MB")

if __name__ == '__main__':
    create_deploy_zip()

