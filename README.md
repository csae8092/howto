<!--lint disable first-heading-level-->

# ACDH-CH Learning resources

## View content

Visit the website at [https://howto.acdh.oeaw.ac.at](https://howto.acdh.oeaw.ac.at).

## Contribute content

### Contribute or edit content via CMS

Sign-in to the CMS via [https://howto.acdh.oeaw.ac.at/cms]. You'll need a GitHub account and be a
member of the [ACDH-CH GitHub organization](https://github.com/acdh-oeaw/).

For edits to articles you can also directly click the "Suggest changes to this resource" links at
the bottom of each post.

### Run a local CMS backend

1. Clone this repository. See above (green Code button).
   `git clone https://github.com/acdh-oeaw/howto`
2. You of course need a nodejs setup. See nodejs.org about your options. Currently we use nodejs
   16.x
3. This project uses yarn. Yarn is part of any current nodejs distribution but has to be enabled
   with `corepack enable`
4. Install dependencies: `yarn install`.
   - If you work with multiple copies/branches of howto, please remember you need to do this for
     every directory you work in
5. We recommend you run a local CMS backend which writes directly to the filesystem, and does not
   require authentication.
6. To apply the correct styles to the CMS preview, you will have to run `yarn cms:styles` once. On
   Windows please run `yarn cms:styles-win`.
7. Start the local cms with `yarn cms:dev`.
8. You may be prompted to allow firewall access for node.exe on Windows. Please allow that on at
   least private networks.
9. Open a second terminal/command prompt.
10. Then run either a production build of the website (does not work on Windows yet) with
    `NEXT_PUBLIC_USE_LOCAL_CMS='true' yarn build && yarn start` or a development build with
    `yarn dev` and visit [http://localhost:3000/cms](http://localhost:3000/cms).

Please be patient starting the services will take a while.

Don't forget to commit and push changes via `git`.

### Use your favorite text editor

Since content is saved to `.mdx` files in the `content/posts` folder, you can use your favourite
text editor to make changes and commit via git. When using VS Code you can install the recommended
extensions to get linting aud auto-formatting for markdown.

### Contributing guidelines

When contributing content directly via git, please use feature branches and don't push to `main`, to
allow for review.

### Note on writing Markdown

Content is saved in MDX format, which is markdown with custom JavaScript components. Most markdown
syntax is supported, however there are
[subtle parsing differences](https://github.com/micromark/mdx-state-machine#72-deviations-from-markdown)
to be aware of. Most notably: the "lesser than" sign `<` needs to be HTML-escaped to `&lt;` (because
it signifies the start of a custom component), and similarly "autolinks" (`<https://example.com>`
instead of `[https://example.com](https://example.com)`) are not allowed.
