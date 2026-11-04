<?php
/**
 * Generic page / single post.
 *
 * @package mansa
 */

get_header();
while ( have_posts() ) :
	the_post();
	?>
<article class="wrap page narrow">
	<h1><?php the_title(); ?></h1>
	<div class="prose"><?php the_content(); ?></div>
</article>
	<?php
endwhile;
get_footer();
