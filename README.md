# stock-backend

# Python virtual enviornment set up

Python 3 comes with a virtual enviornment module built-in called 'venv'. There's no need to download anything. Just jump in and create a vm

1- In terminal navigate to the project folder

2 - To create a virtual enviornment. In this example calling it 'alpha_venv' :

    python3 -m venv alpha_venv

3 - Activate the virtual enviornment by sourcing the activate script in its bin directory

    source alpha_venv/bin/activate

4 - To deactivate the virtual enviornment, just type 'deactivate':

    deactivate

5 - In .gitignore file, you may want to add the virtual enviornment folder as 'venv/' is not picking the folder up.

6 - To delete, just delete the virtual enviornment folder from the project directory

# Data Source

https://www.alphavantage.co/

## To install packages

python3 -m pip install yfinance pandas
