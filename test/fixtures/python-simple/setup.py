import setuptools

# TODO: mm - requirements.txt verwenden - https://stackoverflow.com/questions/14399534/reference-requirements-txt-for-the-install-requires-kwarg-in-setuptools-setup-py
# TODO: mm - twine benutzen https://pypi.org/project/twine/
#
# Kurzanleitung
#    https://medium.com/@joel.barmettler/how-to-upload-your-python-package-to-pypi-65edc5fe9c56

with open("README.md", "r") as fh:
    long_description = fh.read()

setuptools.setup(
    name='process_engine',
    version=setuptools.sic('0.11.1-alpha.11'),
    author="5Minds IT-Solutions GmbH & Co. KG",
    author_email="processengine@5minds.de",
    description="A Client for an process-engine.io hosted workflow engine.",
    long_description=long_description,
    long_description_content_type="text/markdown",
    keywords="workflow-engine processengine client bpmn",
    url="https://github.com/5minds/process_engine-python",
    packages=setuptools.find_packages(),
    classifiers=[
        "Programming Language :: Python :: 3",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
    ],
)
