<?php
/**
 * Front page: one-page layout assembled from template parts.
 *
 * @package mansa
 */

get_header();
get_template_part( 'template-parts/hero' );
get_template_part( 'template-parts/numbers' );
get_template_part( 'template-parts/services' );
get_template_part( 'template-parts/team' );
get_template_part( 'template-parts/stories' );
get_template_part( 'template-parts/contact' );
get_footer();
