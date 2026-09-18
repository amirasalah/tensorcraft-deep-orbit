# Data attribution and changes

Candanedo, L. (2016). Occupancy Detection [Dataset]. UCI Machine Learning
Repository. https://doi.org/10.24432/C5X01N

Source page: https://archive.ics.uci.edu/dataset/357/occupancy+detection
Source download: https://archive.ics.uci.edu/static/public/357/occupancy+detection.zip
Retrieved 2026-09-17. Source ZIP SHA-256:
`4ae3f46aa98eedff564a9f6924d1635173e2fd2c816004342a9be93076d3a81a`

The source is licensed under Creative Commons Attribution 4.0 International:
https://creativecommons.org/licenses/by/4.0/
Legal text: https://creativecommons.org/licenses/by/4.0/legalcode
Keep this attribution, license link and description of modifications when
sharing the data. No endorsement by the data creator or UCI is implied.

Tensorcraft combined the three source files, sorted all 20,560 readings by
source timestamp, kept every tenth row starting at index zero, and renamed
fields. The resulting 2,056 rows preserve source values and labels. No
imputation or scaling was applied. The source timestamp has no timezone;
this package preserves that limitation. The subset and archive hash are
recorded in data.json. Sampling reduces file size and does not make nearby
observations independent.

The starter code and written project materials are original Tensorcraft
teaching material released under CC0-1.0. See CODE-LICENSE.txt. That release
does not replace the dataset's CC BY 4.0 terms or dependency licenses.
