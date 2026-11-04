<?php
/**
 * Services archive.
 *
 * @package mansa
 */

get_header();
?>
<div class="wrap page">
	<p class="eyebrow">Serviços</p>
	<h1>O que fazemos pelo seu pet</h1>
	<div class="card-grid">
		<?php
		while ( have_posts() ) :
			the_post();
			get_template_part( 'template-parts/card-service' );
		endwhile;
		?>
	</div>
</div>
<?php
get_footer();
