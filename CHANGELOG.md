# Changelog

<!-- <START NEW CHANGELOG ENTRY> -->
## 0.8.1 (March 17, 2025)
* BUG FIX: add stripping of `@`,`=`,`[`,`]` when choosing names for variables
  in export to pandas.
* added `JPSLUtils` to dependencies as it is still checked for in legacy usage. 
  This prevents warnings when doing an import (which actually should not be 
  necessary). Will be completely removed in the future.
## 0.8.0 (June 5, 2024)
* Converted to a Jupyter Lab 4+ and notebook 7+ compatible plugin.
* **DEPRECATION:** Input data tables created with earlier versions will not 
  be editable or create pandas dataframes with this version. Tables should 
  be recreated with this version. WHY: programmatic access to notebooks in 
  Jupyter Lab is much more limited.
* **DEPRECATION:** Support for classic Jupyter (nbclassic) is dropped. 
  Versions 0.7.6 should still work with classic Jupyter. 
* Moved actions to buttons from a selection dropdown.
* Added command to insert data input table to the Jupyter Lab command palette.
* Converted editable version of cells to resizable textareas.
* Converted table caption input into a resizable textarea.
* Table actions get red strikeout when extension not enabled/installed.
* Code that creates table no longer automatically collapsed, but only 
  consists of four lines as the html is on a single line. Still can be 
  manually collapsed.
* Switched to Jupyter compatible BSD licensing.
## 0.7.6
* update requirements to use upstream bug fixes.
## 0.7.5 
* smaller input cells
* metadata flag identifying cell as containing a 
  data input table.
## 0.7.4
* Colored and bigger table caption. 
* README updates.
## 0.7.3
* Use jQuery style dialogs.
* When creating Pandas DataFrame from a table import numpy and Pandas 
  only if necessary.
* README updates.  
## 0.7.2 
* Ability to have a table caption.
* Created a file for future custom css.
* Expansion and cleanup of README.md.  
## 0.7.1 
* Bug fixes.
## 0.7.0
* Better handling of empty, string and NaN cells.
* Set Pandas indexes if row labels are not just numeric indexes.  
## 0.6.0
* Added dialog for getting initial table dimensions.
* Added export table data to a Pandas DataFrame table action.
* Bug fixes.  
## 0.5.0
* Initial beta release