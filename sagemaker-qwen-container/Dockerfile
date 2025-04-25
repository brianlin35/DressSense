FROM python:3.10

RUN pip install --upgrade pip
COPY requirements.txt requirements.txt
RUN pip install -r requirements.txt

COPY inference.py /opt/program/inference.py

ENV MODEL_DIR=/opt/ml/model

WORKDIR /opt/program

ENTRYPOINT ["python", "inference.py"]