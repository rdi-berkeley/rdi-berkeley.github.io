# Berkeley RDI Website

## Editing the website

Note that it takes up to a few minutes for the update to be reflected on the deployed webpages. Please disable the caching of the browser to see the latest version in the first time.

### Editing the landing page

1. **Update the content**: Change [this markdown file](https://github.com/rdi-berkeley/rdi-berkeley.github.io/blob/main/index.md).

### How to add/update faculty information

1. **Upload their photo**: Go to [this folder](https://github.com/rdi-berkeley/rdi-berkeley.github.io/tree/main/assets/images/people), click "Add file" button, select "Upload files" option, and add the photo file (preferably in the shape of square in `jpg` format).

2. **Update the entry**: Go to [this file](https://github.com/rdi-berkeley/rdi-berkeley.github.io/blob/main/_data/people.yml), click the small pencil button (that has a hint text "Edit this file", or use [this link](https://github.com/rdi-berkeley/rdi-berkeley.github.io/edit/main/_data/people.yml)). You can see how sections are arranged in the file.
    - If you want to create a new entry, just use the same template as below (please be careful with the indentation). Note that for the field of `image_file` you need to enter exactly the same name that you just uploaded to `/assets/images/people` folder.
    ```
        - name: Dawn Song
            homepage: https://people.eecs.berkeley.edu/~dawnsong/
            image_file: dawn.jpg
            subtitle: "Security & Privacy, Blockchain, ML" 
    ```

### Other changes

Please contact xiaoyuanliu \<AT\> berkeley \<DOT\> edu for further support.