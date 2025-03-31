import os
import sys

def main():
    print("Creating installer directory...")
    os.makedirs("installer", exist_ok=True)
    
    with open("installer/test.txt", "w") as f:
        f.write("This is a test file for the installer package.")
    
    print("Test file created at installer/test.txt")
    print("Script executed successfully.")

if __name__ == "__main__":
    main() 